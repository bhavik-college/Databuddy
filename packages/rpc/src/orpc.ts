import { auth, type User } from "@databuddy/auth";
import {
	and,
	db,
	eq,
	member,
	organization,
	session as sessionTable,
	user as userTable,
} from "@databuddy/db";
import { os as createOS } from "@orpc/server";
import { Autumn as autumn } from "autumn-js";
import { baseErrors } from "./errors";
import {
	enrichSpanWithContext,
	recordORPCError,
	setProcedureAttributes,
} from "./lib/otel";

/**
 * Gets the billing owner ID for the current context.
 * If in an organization, returns the org owner's ID.
 * Otherwise, returns the current user's ID.
 */
async function getBillingOwnerId(userId: string): Promise<{
	customerId: string;
	isOrganization: boolean;
	canUserUpgrade: boolean;
	planId: string;
}> {
	const [orgResult] = await db
		.select({
			ownerId: userTable.id,
			activeOrgId: sessionTable.activeOrganizationId,
		})
		.from(sessionTable)
		.innerJoin(
			organization,
			eq(sessionTable.activeOrganizationId, organization.id)
		)
		.innerJoin(member, eq(organization.id, member.organizationId))
		.innerJoin(userTable, eq(member.userId, userTable.id))
		.where(and(eq(sessionTable.userId, userId), eq(member.role, "owner")))
		.limit(1);

	const customerId = orgResult?.ownerId || userId;
	const isOrganization = Boolean(orgResult?.activeOrgId);
	const canUserUpgrade = !isOrganization || orgResult?.ownerId === userId;

	// Get the plan from Autumn
	let planId = "free";
	try {
		const customerResult = await autumn.customers.get(customerId);
		const customer = customerResult.data;

		if (customer) {
			const activeProduct = customer.products?.find(
				(p) => p.status === "active"
			);
			if (activeProduct?.id) {
				planId = String(activeProduct.id).toLowerCase();
			}
		}
	} catch {
		// Fallback to free plan on error
		planId = "free";
	}

	return { customerId, isOrganization, canUserUpgrade, planId };
}

export const createRPCContext = async (opts: { headers: Headers }) => {
	const session = await auth.api.getSession({
		headers: opts.headers,
	});

	// Get billing information if user is authenticated
	let billingContext:
		| {
			customerId: string;
			isOrganization: boolean;
			canUserUpgrade: boolean;
			planId: string;
		}
		| undefined;

	if (session?.user) {
		try {
			billingContext = await getBillingOwnerId(session.user.id);
		} catch {
			// If billing context fails, continue without it
			billingContext = undefined;
		}
	}

	return {
		db,
		auth,
		session: session?.session,
		user: session?.user as User | undefined,
		billing: billingContext,
		...opts,
	};
};

export type Context = Awaited<ReturnType<typeof createRPCContext>>;

/**
 * Base oRPC instance with context and type-safe errors.
 * All procedures inherit these error definitions for client-side type inference.
 */
const os = createOS.$context<Context>().errors(baseErrors);

export const publicProcedure = os.use(({ context, next }) => {
	setProcedureAttributes("public");
	enrichSpanWithContext(context);
	return next();
});

export const protectedProcedure = os.use(({ context, next, errors }) => {
	setProcedureAttributes("protected");
	enrichSpanWithContext(context);

	if (context.user?.role === "ADMIN") {
		return next({
			context: {
				...context,
				session: context.session,
				user: context.user,
			},
		});
	}

	if (!(context.user && context.session)) {
		recordORPCError({ code: "UNAUTHORIZED" });
		throw errors.UNAUTHORIZED();
	}

	return next({
		context: {
			...context,
			session: context.session,
			user: context.user,
		},
	});
});

export const adminProcedure = protectedProcedure.use(
	({ context, next, errors }) => {
		setProcedureAttributes("admin");
		enrichSpanWithContext(context);

		if (context.user.role !== "ADMIN") {
			recordORPCError({
				code: "FORBIDDEN",
				message: "Admin access required",
			});
			throw errors.FORBIDDEN({ message: "Admin access required" });
		}

		return next({
			context: {
				...context,
				session: context.session,
				user: context.user,
			},
		});
	}
);

export { os };

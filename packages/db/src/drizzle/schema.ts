import {
	pgTable,
	index,
	foreignKey,
	text,
	jsonb,
	timestamp,
	uniqueIndex,
	integer,
	unique,
	boolean,
	pgEnum,
} from "drizzle-orm/pg-core";
import { isNotNull, isNull, sql } from "drizzle-orm";

export const clientType = pgEnum("ClientType", [
	"individual",
	"company",
	"nonprofit",
]);
export const funnelGoalType = pgEnum("FunnelGoalType", [
	"COMPLETION",
	"STEP_CONVERSION",
	"TIME_TO_CONVERT",
]);
export const funnelStepType = pgEnum("FunnelStepType", [
	"PAGE_VIEW",
	"EVENT",
	"CUSTOM",
]);
export const memberRole = pgEnum("MemberRole", [
	"owner",
	"admin",
	"member",
	"viewer",
]);
export const organizationRole = pgEnum("OrganizationRole", [
	"admin",
	"owner",
	"member",
	"viewer",
]);
export const projectStatus = pgEnum("ProjectStatus", [
	"active",
	"completed",
	"on_hold",
	"cancelled",
]);
export const projectType = pgEnum("ProjectType", [
	"website",
	"mobile_app",
	"desktop_app",
	"api",
]);
export const role = pgEnum("Role", [
	"ADMIN",
	"USER",
	"EARLY_ADOPTER",
	"INVESTOR",
	"BETA_TESTER",
	"GUEST",
]);
export const subscriptionStatus = pgEnum("SubscriptionStatus", [
	"active",
	"trialing",
	"past_due",
	"canceled",
	"paused",
	"incomplete",
]);
export const userStatus = pgEnum("UserStatus", [
	"ACTIVE",
	"SUSPENDED",
	"INACTIVE",
]);
export const verificationStatus = pgEnum("VerificationStatus", [
	"PENDING",
	"VERIFIED",
	"FAILED",
]);
export const websiteStatus = pgEnum("WebsiteStatus", [
	"ACTIVE",
	"HEALTHY",
	"UNHEALTHY",
	"INACTIVE",
	"PENDING",
]);

export const auditLogs = pgTable(
	"audit_logs",
	{
		id: text().primaryKey().notNull(),
		action: text().notNull(),
		resourceType: text().notNull(),
		resourceId: text().notNull(),
		details: jsonb(),
		ipAddress: text(),
		userAgent: text(),
		userId: text(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(table) => [
		index("audit_logs_resourceType_resourceId_idx").using(
			"btree",
			table.resourceType.asc().nullsLast().op("text_ops"),
			table.resourceId.asc().nullsLast().op("text_ops"),
		),
		index("audit_logs_userId_idx").using(
			"btree",
			table.userId.asc().nullsLast().op("text_ops"),
		),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "audit_logs_userId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const eventMeta = pgTable(
	"event_meta",
	{
		id: text().primaryKey().notNull(),
		projectId: text().notNull(),
		name: text().notNull(),
		description: text(),
		data: jsonb(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(table) => [
		index("event_meta_projectId_idx").using(
			"btree",
			table.projectId.asc().nullsLast().op("text_ops"),
		),
		foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "event_meta_projectId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("restrict"),
	],
);

export const categories = pgTable(
	"categories",
	{
		id: text().primaryKey().notNull(),
		name: text().notNull(),
		slug: text().notNull(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		deletedAt: timestamp({ precision: 3, mode: "string" }),
	},
	(table) => [
		uniqueIndex("categories_name_key").using(
			"btree",
			table.name.asc().nullsLast().op("text_ops"),
		),
		uniqueIndex("categories_slug_key").using(
			"btree",
			table.slug.asc().nullsLast().op("text_ops"),
		),
	],
);

export const account = pgTable(
	"account",
	{
		id: text().primaryKey().notNull(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id").notNull(),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at", {
			mode: "string",
		}),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
			mode: "string",
		}),
		scope: text(),
		password: text(),
		createdAt: timestamp("created_at", { mode: "string" }).notNull(),
		updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk",
		}).onDelete("cascade"),
	],
);

export const subscriptions = pgTable(
	"subscriptions",
	{
		id: text().primaryKey().notNull(),
		organizationId: text().notNull(),
		customerId: text(),
		priceId: text(),
		productId: text(),
		status: subscriptionStatus().default("active").notNull(),
		startsAt: timestamp({ precision: 3, mode: "string" }),
		endsAt: timestamp({ precision: 3, mode: "string" }),
		canceledAt: timestamp({ precision: 3, mode: "string" }),
		periodEventsCount: integer().default(0).notNull(),
		periodEventsCountExceededAt: timestamp({ precision: 3, mode: "string" }),
		periodEventsLimit: integer().default(0).notNull(),
		interval: text(),
		createdByUserId: text(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(table) => [
		uniqueIndex("subscriptions_organizationId_key").using(
			"btree",
			table.organizationId.asc().nullsLast().op("text_ops"),
		),
		foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [user.id],
			name: "subscriptions_createdByUserId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const session = pgTable(
	"session",
	{
		id: text().primaryKey().notNull(),
		expiresAt: timestamp({ precision: 3, mode: "string" }).notNull(),
		token: text().notNull(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
		ipAddress: text(),
		userAgent: text(),
		userId: text(),
		activeOrganizationId: text("active_organization_id"),
	},
	(table) => [
		uniqueIndex("session_token_key").using(
			"btree",
			table.token.asc().nullsLast().op("text_ops"),
		),
		index("session_userId_idx").using(
			"btree",
			table.userId.asc().nullsLast().op("text_ops"),
		),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	],
);

export const projects = pgTable(
	"projects",
	{
		id: text().primaryKey().notNull(),
		name: text().notNull(),
		slug: text().notNull(),
		description: text(),
		type: projectType().default("website").notNull(),
		organizationId: text("organization_id").notNull(),
		startDate: timestamp({ precision: 3, mode: "string" }),
		endDate: timestamp({ precision: 3, mode: "string" }),
		status: projectStatus().default("active").notNull(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		deletedAt: timestamp({ precision: 3, mode: "string" }),
	},
	(table) => [
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "projects_organization_id_organization_id_fk",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "projects_organizationId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	],
);

export const invitation = pgTable(
	"invitation",
	{
		id: text().primaryKey().notNull(),
		organizationId: text("organization_id").notNull(),
		email: text().notNull(),
		role: text().default("member"),
		teamId: text("team_id"),
		status: text().default("pending").notNull(),
		expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
		inviterId: text("inviter_id").notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "invitation_organization_id_organization_id_fk",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.inviterId],
			foreignColumns: [user.id],
			name: "invitation_inviter_id_user_id_fk",
		}).onDelete("cascade"),
	],
);

export const member = pgTable(
	"member",
	{
		id: text().primaryKey().notNull(),
		organizationId: text("organization_id").notNull(),
		userId: text("user_id").notNull(),
		role: text().default("member").notNull(),
		teamId: text("team_id"),
		createdAt: timestamp("created_at", { mode: "string" }).notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "member_organization_id_organization_id_fk",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "member_user_id_user_id_fk",
		}).onDelete("cascade"),
	],
);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
	createdAt: timestamp("created_at", { mode: "string" }),
	updatedAt: timestamp("updated_at", { mode: "string" }),
});

export const twoFactor = pgTable(
	"two_factor",
	{
		id: text().primaryKey().notNull(),
		secret: text().notNull(),
		backupCodes: text("backup_codes").notNull(),
		userId: text("user_id").notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "two_factor_user_id_user_id_fk",
		}).onDelete("cascade"),
	],
);

export const userPreferences = pgTable(
	"user_preferences",
	{
		id: text().primaryKey().notNull(),
		userId: text().notNull(),
		timezone: text().default("auto").notNull(),
		dateFormat: text().default("MMM D, YYYY").notNull(),
		timeFormat: text().default("h:mm a").notNull(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
	},
	(table) => [
		uniqueIndex("user_preferences_userId_key").using(
			"btree",
			table.userId.asc().nullsLast().op("text_ops"),
		),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "user_preferences_userId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	],
);

export const websites = pgTable(
	"websites",
	{
		id: text().primaryKey().notNull(),
		domain: text().notNull(),
		name: text(),
		status: websiteStatus().default("ACTIVE").notNull(),
		userId: text(),
		projectId: text(),
		isPublic: boolean().default(false).notNull(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		deletedAt: timestamp({ precision: 3, mode: "string" }),
		organizationId: text("organization_id"),
	},
	(table) => [
		uniqueIndex("websites_user_domain_unique")
			.on(table.userId, table.domain)
			.where(isNull(table.organizationId)),
		uniqueIndex("websites_org_domain_unique")
			.on(table.organizationId, table.domain)
			.where(isNotNull(table.organizationId)),
		uniqueIndex("websites_projectId_key").using(
			"btree",
			table.projectId.asc().nullsLast().op("text_ops"),
		),
		index("websites_userId_idx").using(
			"btree",
			table.userId.asc().nullsLast().op("text_ops"),
		),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "websites_userId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "websites_projectId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "websites_organization_id_organization_id_fk",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "websites_organizationId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	],
);

export const user = pgTable(
	"user",
	{
		id: text().primaryKey().notNull(),
		name: text().notNull(),
		email: text().notNull(),
		emailVerified: boolean("email_verified").notNull(),
		image: text(),
		firstName: text(),
		lastName: text(),
		status: userStatus().default("ACTIVE").notNull(),
		createdAt: timestamp("created_at", { mode: "string" }).notNull(),
		updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
		deletedAt: timestamp({ precision: 3, mode: "string" }),
		role: role().default("USER").notNull(),
		twoFactorEnabled: boolean("two_factor_enabled"),
	},
	(table) => [unique("user_email_unique").on(table.email)],
);

export const userStripeConfig = pgTable(
	"user_stripe_config",
	{
		id: text().primaryKey().notNull(),
		userId: text("user_id").notNull(),
		webhookToken: text("webhook_token").notNull(),
		stripeSecretKey: text("stripe_secret_key").notNull(),
		stripePublishableKey: text("stripe_publishable_key"),
		webhookSecret: text("webhook_secret").notNull(),
		isLiveMode: boolean("is_live_mode").default(false).notNull(),
		isActive: boolean("is_active").default(true).notNull(),
		lastWebhookAt: timestamp("last_webhook_at", { mode: "string" }),
		webhookFailureCount: integer("webhook_failure_count").default(0).notNull(),
		createdAt: timestamp("created_at", { mode: "string" }).notNull(),
		updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
	},
	(table) => [
		uniqueIndex("user_stripe_config_userId_key").using(
			"btree",
			table.userId.asc().nullsLast().op("text_ops"),
		),
		uniqueIndex("user_stripe_config_webhookToken_key").using(
			"btree",
			table.webhookToken.asc().nullsLast().op("text_ops"),
		),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "user_stripe_config_userId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	],
);

export const funnelGoals = pgTable(
	"funnel_goals",
	{
		id: text().primaryKey().notNull(),
		funnelId: text().notNull(),
		goalType: funnelGoalType().notNull(),
		targetValue: text(),
		description: text(),
		isActive: boolean().default(true).notNull(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(table) => [
		index("funnel_goals_funnelId_idx").using(
			"btree",
			table.funnelId.asc().nullsLast().op("text_ops"),
		),
		foreignKey({
			columns: [table.funnelId],
			foreignColumns: [funnelDefinitions.id],
			name: "funnel_goals_funnelId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	],
);

export const funnelDefinitions = pgTable(
	"funnel_definitions",
	{
		id: text().primaryKey().notNull(),
		websiteId: text().notNull(),
		name: text().notNull(),
		description: text(),
		steps: jsonb().notNull(),
		filters: jsonb(),
		isActive: boolean().default(true).notNull(),
		createdBy: text().notNull(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		deletedAt: timestamp({ precision: 3, mode: "string" }),
	},
	(table) => [
		index("funnel_definitions_createdBy_idx").using(
			"btree",
			table.createdBy.asc().nullsLast().op("text_ops"),
		),
		index("funnel_definitions_websiteId_idx").using(
			"btree",
			table.websiteId.asc().nullsLast().op("text_ops"),
		),
		foreignKey({
			columns: [table.websiteId],
			foreignColumns: [websites.id],
			name: "funnel_definitions_websiteId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [user.id],
			name: "funnel_definitions_createdBy_fkey",
		})
			.onUpdate("cascade")
			.onDelete("restrict"),
	],
);

export const goals = pgTable(
	"goals",
	{
		id: text().primaryKey().notNull(),
		websiteId: text().notNull(),
		type: text().notNull(), // e.g., 'PAGE_VIEW', 'EVENT', 'CUSTOM'
		target: text().notNull(), // event name or page path
		name: text().notNull(),
		description: text(),
		filters: jsonb(),
		isActive: boolean().default(true).notNull(),
		createdBy: text().notNull(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		deletedAt: timestamp({ precision: 3, mode: "string" }),
	},
	(table) => [
		index("goals_websiteId_idx").using(
			"btree",
			table.websiteId.asc().nullsLast().op("text_ops"),
		),
		index("goals_createdBy_idx").using(
			"btree",
			table.createdBy.asc().nullsLast().op("text_ops"),
		),
		foreignKey({
			columns: [table.websiteId],
			foreignColumns: [websites.id],
			name: "goals_websiteId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [user.id],
			name: "goals_createdBy_fkey",
		})
			.onUpdate("cascade")
			.onDelete("restrict"),
	],
);

export const team = pgTable(
	"team",
	{
		id: text().primaryKey().notNull(),
		name: text().notNull(),
		organizationId: text("organization_id").notNull(),
		createdAt: timestamp("created_at", { mode: "string" }).notNull(),
		updatedAt: timestamp("updated_at", { mode: "string" }),
	},
	(table) => [
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "team_organization_id_organization_id_fk",
		}).onDelete("cascade"),
	],
);

export const apikey = pgTable(
	"apikey",
	{
		id: text().primaryKey().notNull(),
		name: text(),
		start: text(),
		prefix: text(),
		key: text().notNull(),
		userId: text("user_id").notNull(),
		refillInterval: integer("refill_interval"),
		refillAmount: integer("refill_amount"),
		lastRefillAt: timestamp("last_refill_at", { mode: "string" }),
		enabled: boolean().default(true),
		rateLimitEnabled: boolean("rate_limit_enabled").default(true),
		rateLimitTimeWindow: integer("rate_limit_time_window").default(86400000),
		rateLimitMax: integer("rate_limit_max").default(10),
		requestCount: integer("request_count"),
		remaining: integer(),
		lastRequest: timestamp("last_request", { mode: "string" }),
		expiresAt: timestamp("expires_at", { mode: "string" }),
		createdAt: timestamp("created_at", { mode: "string" }).notNull(),
		updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
		permissions: text(),
		metadata: text(),
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "apikey_user_id_user_id_fk",
		}).onDelete("cascade"),
	],
);

export const organization = pgTable(
	"organization",
	{
		id: text().primaryKey().notNull(),
		name: text().notNull(),
		slug: text(),
		logo: text(),
		createdAt: timestamp("created_at", { mode: "string" }).notNull(),
		metadata: text(),
	},
	(table) => [unique("organization_slug_unique").on(table.slug)],
);

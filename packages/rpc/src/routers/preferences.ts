import { userPreferences } from '@databuddy/db';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

const preferencesSchema = z.object({
	timezone: z.string().optional(),
	dateFormat: z.string().optional(),
	timeFormat: z.string().optional(),
});

export const preferencesRouter = createTRPCRouter({
	getUserPreferences: protectedProcedure.query(async ({ ctx }) => {
		const user = ctx.user;
		if (!user) {
			throw new TRPCError({ code: 'UNAUTHORIZED' });
		}

		let preferences = await ctx.db.query.userPreferences.findFirst({
			where: eq(userPreferences.userId, user.id),
		});

		if (!preferences) {
			const inserted = await ctx.db
				.insert(userPreferences)
				.values({
					id: nanoid(),
					userId: user.id,
					timezone: 'auto',
					dateFormat: 'MMM D, YYYY',
					timeFormat: 'h:mm a',
					updatedAt: new Date().toISOString(),
				} as any)
				.returning();
			preferences = inserted[0];
		}
		return preferences;
	}),

	updateUserPreferences: protectedProcedure
		.input(preferencesSchema)
		.mutation(async ({ ctx, input }) => {
			const user = ctx.user;
			if (!user) {
				throw new TRPCError({ code: 'UNAUTHORIZED' });
			}

			let preferences = await ctx.db.query.userPreferences.findFirst({
				where: eq(userPreferences.userId, user.id),
			});

			if (preferences) {
				const updated = await ctx.db
					.update(userPreferences)
					.set({
						timezone: input.timezone || preferences.timezone,
						dateFormat: input.dateFormat || preferences.dateFormat,
						timeFormat: input.timeFormat || preferences.timeFormat,
						updatedAt: new Date().toISOString(),
					} as any)
					.where(eq(userPreferences.userId, user.id))
					.returning();
				preferences = updated[0];
			} else {
				const inserted = await ctx.db
					.insert(userPreferences)
					.values({
						id: nanoid(),
						userId: user.id,
						timezone: input.timezone || 'auto',
						dateFormat: input.dateFormat || 'MMM D, YYYY',
						timeFormat: input.timeFormat || 'h:mm a',
						updatedAt: new Date().toISOString(),
					} as any)
					.returning();
				preferences = inserted[0];
			}
			return preferences;
		}),
});

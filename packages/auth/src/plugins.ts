import type { BetterAuthPlugin } from 'better-auth';
import { APIError, createAuthEndpoint } from 'better-auth/api';
import type { User } from './auth';

export const performancePlugin = () => {
	return {
		id: 'performance',
		endpoints: {
			initiatePerformanceTest: createAuthEndpoint(
				'/performance/initiate',
				{ method: 'POST' },
				async (ctx) => {
					const logger = ctx.context.logger;
					const adapter = ctx.context.adapter;
					logger.warn(
						"Warning, if you're seeing this in production, please remove the performance plugin unless it's intentional."
					);

					if (ctx.request) {
						throw new APIError('FORBIDDEN', {
							message:
								'This endpoint is only available to call from the server.',
						});
					}

					logger.info('Starting performance test...');
					logger.info('Fetching users...');
					const { data: users, duration: usersDuration } = await timeAction(
						async () => {
							const users = await adapter.findMany<User>({
								model: 'user',
							});
							return users;
						}
					);
					logger.info(`Fetched ${users.length} users in ${usersDuration}ms`);
					if (!users.length) {
						throw new APIError('INTERNAL_SERVER_ERROR', {
							message: 'This test requires at least one user to be present.',
						});
					}
					logger.info('Fetching an individual user...');
					const { data: firstUser, duration: firstUserDuration } =
						await timeAction(async () => {
							const user = await adapter.findOne<User>({
								model: 'user',
								where: [{ field: 'id', value: users[0].id }],
							});
							return user;
						});
					logger.info(`Fetched an individual user in ${firstUserDuration}ms`);
				}
			),
		},
	} satisfies BetterAuthPlugin;
};

async function timeAction<T>(
	action: () => Promise<T>
): Promise<{ data: T; duration: number }> {
	const start = performance.now();
	const result = await action();
	const end = performance.now();
	const duration = end - start;
	return { data: result, duration };
}

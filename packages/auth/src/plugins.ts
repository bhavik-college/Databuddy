import type { BetterAuthPlugin } from 'better-auth';
import { APIError, createAuthEndpoint } from 'better-auth/api';
import { z } from 'zod';
import type { User } from '@/lib/auth';
export const performancePlugin = () => {
	return {
		id: 'performance',
		endpoints: {
			initiatePerformanceTest: createAuthEndpoint(
				'/performance/initiate',
				{
					method: 'POST',
					body: z.object({
						rawQueryAllUsers: z.function(),
						rawQueryOneUser: z.function().args(z.string()),
					}),
				},
				async (ctx) => {
					const results = [];
					for await (const _ of Array(10)) {
						const result = await startTest();
						results.push(result);
					}

					// Calculate averages
					const averages = {
						usersDuration:
							results.reduce((sum, r) => sum + r.usersDuration, 0) /
							results.length,
						rawUsersDuration:
							results.reduce((sum, r) => sum + r.rawUsersDuration, 0) /
							results.length,
						firstUserDuration:
							results.reduce((sum, r) => sum + r.firstUserDuration, 0) /
							results.length,
						rawFirstUserDuration:
							results.reduce((sum, r) => sum + r.rawFirstUserDuration, 0) /
							results.length,
					};

					// Display results table
					console.log('\n=== PERFORMANCE TEST RESULTS ===');
					console.table([
						{
							'Test Type': 'All Users',
							'Better-Auth': Number.parseFloat(
								averages.usersDuration.toFixed(2)
							),
							Raw: Number.parseFloat(averages.rawUsersDuration.toFixed(2)),
						},
						{
							'Test Type': 'Single User',
							'Better-Auth': Number.parseFloat(
								averages.firstUserDuration.toFixed(2)
							),
							Raw: Number.parseFloat(averages.rawFirstUserDuration.toFixed(2)),
						},
					]);
					console.log(`\nTests completed: ${results.length}`);
					console.log('===============================================\n');

					async function startTest() {
						const { rawQueryAllUsers, rawQueryOneUser } = ctx.body;
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

						// BA adapter query all users
						logger.info('Starting performance test...');
						logger.info('--------------------------------');

						const { data: users, duration: usersDuration } = await timeAction(
							async () => {
								const users = await adapter.findMany<User>({
									model: 'user',
								});
								return users;
							}
						);
						logger.info(
							`BETTER-AUTH: Fetched ${users.length} users in ${usersDuration}ms`
						);
						if (!users.length) {
							throw new APIError('INTERNAL_SERVER_ERROR', {
								message: 'This test requires at least one user to be present.',
							});
						}

						// raw query all users
						const { data: rawUsers, duration: rawUsersDuration } =
							await timeAction(async () => {
								const users = (await rawQueryAllUsers()) as User[];
								return users;
							});
						logger.info(
							`RAW QUERY: Fetched ${rawUsers.length} users in ${rawUsersDuration}ms`
						);

						logger.info('--------------------------------');

						// BA adapter query one user
						const { data: firstUser, duration: firstUserDuration } =
							await timeAction(async () => {
								const user = await adapter.findOne<User>({
									model: 'user',
									where: [{ field: 'id', value: users[0].id }],
								});
								return user;
							});
						logger.info(
							`BETTER-AUTH: Fetched an individual user in ${firstUserDuration}ms`
						);

						// raw query one user
						const { data: rawFirstUser, duration: rawFirstUserDuration } =
							await timeAction(async () => {
								const user = (await rawQueryOneUser(users[0].id)) as User;
								return user;
							});
						logger.info(
							`RAW QUERY: Fetched an individual user in ${rawFirstUserDuration}ms`
						);

						logger.info('--------------------------------');

						await new Promise((resolve) => setTimeout(resolve, 1000));
						return {
							usersDuration,
							rawUsersDuration,
							firstUserDuration,
							rawFirstUserDuration,
						};
					}
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

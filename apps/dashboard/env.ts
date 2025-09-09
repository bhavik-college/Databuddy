import z from 'zod';

const envSchema = z.object({
	VERCEL_CLIENT_ID: z.string(),
	VERCEL_CLIENT_SECRET: z.string(),
	BETTER_AUTH_SECRET: z.string(),
	CLICKHOUSE_URL: z.string(),
	DATABASE_URL: z.string(),
	REDIS_URL: z.string(),
	AI_API_KEY: z.string(),
	BETTER_AUTH_URL: z.string(),
	AUTUMN_SECRET_KEY: z.string(),
	NODE_ENV: z.string().default('development'),
	GITHUB_CLIENT_ID: z.string(),
	GITHUB_CLIENT_SECRET: z.string(),
	GOOGLE_CLIENT_ID: z.string(),
	GOOGLE_CLIENT_SECRET: z.string(),
	RESEND_API_KEY: z.string(),
	NEXT_PUBLIC_API_URL: z.string(),
});

const isDevelopment = process.env.NODE_ENV === 'development';
const skipValidation = isDevelopment || process.env.SKIP_VALIDATION === 'true';

export const env = skipValidation ? process.env : envSchema.parse(process.env);

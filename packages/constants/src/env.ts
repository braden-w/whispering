import { type } from 'arktype';

export const envSchema = type({
	// Common
	NODE_ENV: "'development' | 'production' | undefined",

	// Auth service
	DATABASE_URL: 'string.url',
	BETTER_AUTH_URL: 'string.url',
	BETTER_AUTH_SECRET: 'string',
	GITHUB_CLIENT_ID: 'string',
	GITHUB_CLIENT_SECRET: 'string',
});

export type Env = typeof envSchema.infer;

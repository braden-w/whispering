import { type } from 'arktype';

export const envSchema = type({
	// Environment (not NODE_ENV because it's not available in Workers. We manually set it per environment)
	ENVIRONMENT: "'development' | 'production'",

	// Auth service
	DATABASE_URL: 'string.url',
	BETTER_AUTH_URL: 'string.url',
	BETTER_AUTH_SECRET: 'string',
	GITHUB_CLIENT_ID: 'string',
	GITHUB_CLIENT_SECRET: 'string',
});

export type Env = typeof envSchema.infer;

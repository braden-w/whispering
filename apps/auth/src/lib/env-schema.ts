import { type } from 'arktype';

export const envSchema = type({
	DATABASE_URL: 'string.url',
	GITHUB_CLIENT_ID: 'string',
	GITHUB_CLIENT_SECRET: 'string',
	BETTER_AUTH_URL: 'string.url',
	BETTER_AUTH_SECRET: 'string',
});

export type Env = typeof envSchema.infer;

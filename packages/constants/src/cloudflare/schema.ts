import { type } from 'arktype';

/**
 * Cloudflare Workers environment schema
 * For use in Cloudflare Workers contexts
 */
const cloudflareEnvSchema = type({
	NODE_ENV: "'development' | 'production'",
	
	// Auth service
	DATABASE_URL: 'string.url',
	BETTER_AUTH_URL: 'string.url',
	BETTER_AUTH_SECRET: 'string',
	GITHUB_CLIENT_ID: 'string',
	GITHUB_CLIENT_SECRET: 'string',
});

export function validateCloudflareEnv(env: unknown): CloudflareEnv {
	const result = cloudflareEnvSchema(env);
	if (result instanceof type.errors) throw new Error(result.summary);
	return result;
}

export type CloudflareEnv = typeof cloudflareEnvSchema.infer;
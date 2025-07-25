import { type } from 'arktype';

const envSchema = type({
	// Mode (not NODE_ENV because it's not available in Workers. We manually set it in Cloudflare's `env` and it is already present in Vite's `import.meta.env`)
	MODE: "'development' | 'production'",

	// Auth service
	DATABASE_URL: 'string.url',
	BETTER_AUTH_URL: 'string.url',
	BETTER_AUTH_SECRET: 'string',
	GITHUB_CLIENT_ID: 'string',
	GITHUB_CLIENT_SECRET: 'string',
});

export function validateEnv(env: unknown) {
	const result = envSchema(env);
	if (result instanceof type.errors) throw new Error(result.summary);
	return result;
}

export type Env = typeof envSchema.infer;

import { type } from 'arktype';

/**
 * Node.js environment schema - validates NODE_ENV + server variables
 * For use in server-side/Node.js contexts
 */
const nodeEnvSchema = type({
	NODE_ENV: "'development' | 'production'",

	// Auth service
	DATABASE_URL: 'string.url',
	BETTER_AUTH_URL: 'string.url',
	BETTER_AUTH_SECRET: 'string',
	GITHUB_CLIENT_ID: 'string',
	GITHUB_CLIENT_SECRET: 'string',
});

export function validateNodeEnv(env: unknown): Env {
	const result = nodeEnvSchema(env);
	if (result instanceof type.errors) throw new Error(result.summary);
	return result;
}

export type NodeEnv = typeof nodeEnvSchema.infer;

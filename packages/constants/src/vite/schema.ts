import { type } from 'arktype';

/**
 * Vite environment schema - only validates MODE
 * For use in client-side/Vite contexts
 */
const viteEnvSchema = type({
	MODE: "'development' | 'production'",
});

export function validateViteEnv(env: unknown) {
	const result = viteEnvSchema(env);
	if (result instanceof type.errors) throw new Error(result.summary);
	return result;
}

export type ViteEnv = typeof viteEnvSchema.infer;
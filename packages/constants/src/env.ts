import { validateEnv } from './env-schema.js';

/**
 * Build-time environment variables.
 *
 * IMPORTANT: This file reads from `process.env` which is only available at build time.
 * DO NOT import this file inside Cloudflare Workers or other edge runtime environments
 * where `process.env` is not available.
 *
 * This is intended for use in build-time configuration files (like `drizzle.config.ts`
 * and `auth.ts`) which are meant to be run locally on my machine (where the Node.js
 * environment is available) to generate files.
 *
 * For runtime environments like Cloudflare Workers, access environment variables through
 * the platform's native env object (`c.env`) instead. It should already be typed as
 * `Env`, or you can pass it to the `validateEnv` function.
 */
export const env = validateEnv(process.env);

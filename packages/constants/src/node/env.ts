import { validateNodeEnv } from './schema.js';

/**
 * Node.js build-time environment and URLs.
 * Uses process.env.NODE_ENV for environment detection.
 *
 * For use in Node.js contexts (server-side applications).
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
 * `NodeEnv`, or you can pass it to the `validateNodeEnv` function.
 */
export const env = validateNodeEnv(process.env);

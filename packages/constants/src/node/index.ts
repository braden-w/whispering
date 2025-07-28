/**
 * All Node.js/server-side constants and utilities
 * Uses process.env.NODE_ENV for environment detection
 */

export { APPS, APP_URLS } from './apps.js';
export { validateNodeEnv, type NodeEnv } from './schema.js';
export { env } from './env.js';

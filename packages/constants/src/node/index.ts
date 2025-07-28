/**
 * All Node.js/server-side constants and utilities
 * Uses process.env.NODE_ENV for environment detection
 */

export { APPS, APP_URLS } from './apps.js';
export { validateNodeEnv, type Env, type NodeEnv } from './schema.js';
export { APPS as APPS_WITH_ENV, env } from './env.js';

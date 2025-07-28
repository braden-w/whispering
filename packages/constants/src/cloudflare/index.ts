/**
 * Cloudflare Workers constants and utilities
 * Takes environment at call time for dynamic resolution
 * Source of truth for lazy app constants
 */

export { APPS, APP_URLS } from './apps.js';
export { validateCloudflareEnv, type CloudflareEnv } from './schema.js';

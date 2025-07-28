import {
	APPS as APPS_LAZY,
	APP_URLS as APP_URLS_LAZY,
} from '../cloudflare/apps.js';
import { env } from './env.js';

/**
 * Node.js build-time URLs (derived from cloudflare lazy functions).
 * Uses process.env.NODE_ENV for environment detection.
 *
 * For use in Node.js contexts that only need URL constants.
 */
export const APPS = APPS_LAZY(env);

/**
 * All application URLs for Node.js contexts.
 * Derived from cloudflare lazy function, evaluated at build time.
 *
 * Primarily used for CORS configuration in server-side applications.
 */
export const APP_URLS = APP_URLS_LAZY(env);

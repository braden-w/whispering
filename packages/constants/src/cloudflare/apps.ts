import type { CloudflareEnv } from './schema.js';

/**
 * Cloudflare Workers URLs - lazy evaluation with environment.
 * Source of truth for lazy app constants.
 * 
 * For use in Cloudflare Workers and other contexts where environment is provided at call time.
 */
export const APPS = (env: CloudflareEnv) => ({
	/**
	 * Authentication service for the application ecosystem
	 */
	AUTH: {
		URL:
			env.NODE_ENV === 'production'
				? 'https://auth.epicenter.so'
				: 'http://localhost:8787',
	},
	/**
	 * Main epicenter.sh web application
	 */
	SH: {
		URL:
			env.NODE_ENV === 'production'
				? 'https://epicenter.sh'
				: 'http://localhost:5173',
	},
	/**
	 * Whispering audio transcription application
	 */
	AUDIO: {
		URL:
			env.NODE_ENV === 'production'
				? 'https://whispering.bradenwong.com'
				: 'http://localhost:1420',
	},
} as const);

/**
 * All application URLs for Cloudflare Workers.
 * Takes environment at call time for dynamic resolution.
 * 
 * Primarily used for CORS configuration.
 */
export const APP_URLS = (env: CloudflareEnv) => Object.values(APPS(env)).map((app) => app.URL);
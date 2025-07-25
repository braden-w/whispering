import type { Env } from './env-schema.js';

/**
 * Configuration for all application URLs across the ecosystem.
 *
 * URLs are environment-aware and swap between production and development based on the
 * `ENVIRONMENT` environment variable:
 * - In production (ENVIRONMENT='production'): Uses production domains
 * - In development (any other ENVIRONMENT value): Uses localhost URLs
 *
 * @example
 * // In production:
 * APPS(env).AUTH.URL // 'https://auth.epicenter.sh'
 *
 * // In development:
 * APPS(env).AUTH.URL // 'http://localhost:8787'
 */
export const APPS = ({ ENVIRONMENT }: Pick<Env, 'ENVIRONMENT'>) =>
	({
		/**
		 * Authentication service for the application ecosystem
		 */
		AUTH: {
			URL:
				ENVIRONMENT === 'production'
					? 'https://auth.epicenter.sh'
					: 'http://localhost:8787',
		},
		/**
		 * Main epicenter.sh web application
		 */
		SH: {
			URL:
				ENVIRONMENT === 'production'
					? 'https://epicenter.sh'
					: 'http://localhost:5173',
		},
		/**
		 * Whispering audio transcription application
		 */
		AUDIO: {
			URL:
				ENVIRONMENT === 'production'
					? 'https://whispering.bradenwong.com'
					: 'http://localhost:1420',
		},
	}) as const;

/**
 * Type representing the available application keys: 'AUTH' | 'SH' | 'AUDIO'
 */
export type App = keyof ReturnType<typeof APPS>;

/**
 * A list of all application URLs extracted from the APPS configuration.
 * Primarily used for CORS configuration to allow cross-origin requests between services.
 *
 * The URLs in this array will change based on the environment:
 *
 * @example
 * // Use in CORS configuration
 * cors({
 *   origin: APP_URLS,
 *   credentials: true
 * })
 */
export const APP_URLS = (env: Pick<Env, 'ENVIRONMENT'>) =>
	Object.values(APPS(env)).map((app) => app.URL);

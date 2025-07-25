import type { Env } from '#env-schema';
import type { ImportMetaEnv } from 'vite/types';

/**
 * Configuration for all application URLs across the ecosystem.
 *
 * URLs are mode-aware and swap between production and development based on the
 * `MODE` variable:
 * - In production (MODE='production'): Uses production domains
 * - In development (any other MODE value): Uses localhost URLs
 *
 * @example
 * // In production:
 * APPS(env).AUTH.URL // 'https://auth.epicenter.sh'
 *
 * // In development:
 * APPS(env).AUTH.URL // 'http://localhost:8787'
 */
export const APPS = ({
	MODE,
}: Pick<Env, 'MODE'> | Pick<ImportMetaEnv, 'MODE'>) =>
	({
		/**
		 * Authentication service for the application ecosystem
		 */
		AUTH: {
			URL:
				MODE === 'production'
					? 'https://auth.epicenter.sh'
					: 'http://localhost:8787',
		},
		/**
		 * Main epicenter.sh web application
		 */
		SH: {
			URL:
				MODE === 'production'
					? 'https://epicenter.sh'
					: 'http://localhost:5173',
		},
		/**
		 * Whispering audio transcription application
		 */
		AUDIO: {
			URL:
				MODE === 'production'
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
 * The URLs in this array will change based on the mode:
 *
 * @example
 * // Use in CORS configuration
 * cors({
 *   origin: APP_URLS,
 *   credentials: true
 * })
 */
export const APP_URLS = (env: Pick<Env, 'MODE'>) =>
	Object.values(APPS(env)).map((app) => app.URL);

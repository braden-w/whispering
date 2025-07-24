const environment =
	process.env.NODE_ENV === 'production' ? 'production' : 'development';

/**
 * Configuration for all application URLs across the ecosystem.
 *
 * URLs are environment-aware and automatically swap between production and development
 * based on the NODE_ENV environment variable:
 * - In production (NODE_ENV='production'): Uses production domains
 * - In development (any other NODE_ENV value): Uses localhost URLs
 *
 * @example
 * // In production:
 * APPS.AUTH.URL // 'https://auth.epicenter.sh'
 *
 * // In development:
 * APPS.AUTH.URL // 'http://localhost:8787'
 */
export const APPS = {
	/**
	 * Authentication service for the application ecosystem
	 */
	AUTH: {
		URL:
			environment === 'production'
				? 'https://auth.epicenter.sh'
				: 'http://localhost:8787',
	},
	/**
	 * Main epicenter.sh web application
	 */
	SH: {
		URL:
			environment === 'production'
				? 'https://epicenter.sh'
				: 'http://localhost:5173',
	},
	/**
	 * Whispering audio transcription application
	 */
	AUDIO: {
		URL:
			environment === 'production'
				? 'https://whispering.bradenwong.com'
				: 'http://localhost:1420',
	},
} as const;

/**
 * Type representing the available application keys: 'AUTH' | 'SH' | 'AUDIO'
 */
export type App = keyof typeof APPS;

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
export const APP_URLS = Object.values(APPS).map((app) => app.URL);

/**
 * Vite build-time URLs.
 * Uses import.meta.env.MODE for environment detection.
 * 
 * For use in Vite contexts (client-side applications).
 */
export const APPS = {
	/**
	 * Authentication service for the application ecosystem
	 */
	AUTH: {
		URL:
			import.meta.env.MODE === 'production'
				? 'https://auth.epicenter.so'
				: 'http://localhost:8787',
	},
	/**
	 * Main epicenter.sh web application
	 */
	SH: {
		URL:
			import.meta.env.MODE === 'production'
				? 'https://epicenter.sh'
				: 'http://localhost:5173',
	},
	/**
	 * Whispering audio transcription application
	 */
	AUDIO: {
		URL:
			import.meta.env.MODE === 'production'
				? 'https://whispering.bradenwong.com'
				: 'http://localhost:1420',
	},
} as const;

/**
 * All application URLs for Vite contexts.
 * Uses import.meta.env.MODE for environment detection.
 * 
 * Primarily used for CORS configuration in client-side applications.
 */
export const APP_URLS = Object.values(APPS).map((app) => app.URL);
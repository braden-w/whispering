const environment =
	process.env.NODE_ENV === 'production' ? 'production' : 'development';

export const APPS = {
	AUTH: {
		URL:
			environment === 'production'
				? 'https://auth.epicenter.sh'
				: 'http://localhost:8787',
	},
	SH: {
		URL:
			environment === 'production'
				? 'https://epicenter.sh'
				: 'http://localhost:5173',
	},
	AUDIO: {
		URL:
			environment === 'production'
				? 'https://whispering.bradenwong.com'
				: 'http://localhost:1420',
	},
} as const;

export type App = keyof typeof APPS;

export const APP_URLS = Object.values(APPS).map((app) => app.URL);

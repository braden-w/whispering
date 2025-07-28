import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@repo/db';
import { APPS, APP_URLS, type Env } from '@repo/constants/cloudflare';

export const auth = (env: Env) =>
	betterAuth({
		database: drizzleAdapter(db(env), { provider: 'pg' }),
		socialProviders: {
			github: {
				clientId: env.GITHUB_CLIENT_ID,
				clientSecret: env.GITHUB_CLIENT_SECRET,
			},
		},
		trustedOrigins: APP_URLS(env),
		baseURL: APPS(env).AUTH.URL,
		advanced: {
			crossSubDomainCookies: {
				enabled: true,
			},
		},
	});

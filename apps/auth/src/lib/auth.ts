import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import type { Env } from '@repo/constants/env-schema';
import { APP_URLS, APPS } from '@repo/constants';

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

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import type { Env } from './env';

export const auth = (env: Env) =>
	betterAuth({
		database: drizzleAdapter(db(env), { provider: 'pg' }),
		socialProviders: {
			github: {
				clientId: env.GITHUB_CLIENT_ID,
				clientSecret: env.GITHUB_CLIENT_SECRET,
			},
		},
		advanced: {
			crossSubDomainCookies: {
				enabled: true,
			},
		},
	});

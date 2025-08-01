import type { Context } from 'hono';
import type { CloudflareEnv } from '@repo/constants/cloudflare';
import type { User, Session } from '../lib/auth';
import { db } from '@repo/db';

export function createContext(
	c: Context<{
		Bindings: CloudflareEnv;
		Variables: {
			user: User | null;
			session: Session | null;
		};
	}>,
) {
	return {
		user: c.var.user,
		session: c.var.session,
		db: db(c.env),
		env: c.env,
	} as const;
}

export type TRPCContext = ReturnType<typeof createContext>;

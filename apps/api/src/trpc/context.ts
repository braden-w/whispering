import type { Context } from 'hono';
import type { CloudflareEnv } from '@repo/constants/cloudflare';
import type { User, Session } from '../lib/auth';
import { db } from '@repo/db';

export type TRPCContext = {
	user: User | null;
	session: Session | null;
	db: ReturnType<typeof db>;
};

export function createContext(
	c: Context<{
		Bindings: CloudflareEnv;
		Variables: {
			user: User | null;
			session: Session | null;
		};
	}>,
): TRPCContext {
	return {
		user: c.var.user,
		session: c.var.session,
		db: db(c.env),
	};
}

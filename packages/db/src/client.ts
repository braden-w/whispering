import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import type { CloudflareEnv } from '@repo/constants/cloudflare';
import * as schema from './schema';

export const db = (env: CloudflareEnv) => {
	const sql = neon(env.DATABASE_URL);
	return drizzle({ client: sql, schema });
};

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import type { Env } from '../env-schema';

export const db = (env: Env) => {
	const sql = neon(env.DATABASE_URL);
	return drizzle({ client: sql });
};

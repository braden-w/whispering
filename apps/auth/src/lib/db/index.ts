import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import type { Env } from '../env';

export const db = (env: Env) => {
	const sql = neon(env.DATABASE_URL);
	drizzle({ client: sql });
};

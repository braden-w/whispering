import { defineConfig } from 'drizzle-kit';
import { env } from './src/lib/env';

export default defineConfig({
	schema: './src/db/schema/*',
	out: './src/db/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: env.DATABASE_URL,
	},
});

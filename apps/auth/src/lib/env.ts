import { type } from 'arktype';
import { config } from 'dotenv';

config({ path: '.env' });

const envSchema = type({
	BETTER_AUTH_SECRET: 'string',
	BETTER_AUTH_URL: 'string.url',
	DATABASE_URL: 'string.url',
});

export const env = envSchema(process.env);

import { config } from 'dotenv';
import { envSchema } from '@repo/constants/env';
import { type } from 'arktype';

config({ path: '.env' });

const result = envSchema(process.env);
if (result instanceof type.errors) throw new Error(result.summary);

export const env = result;

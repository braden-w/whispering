import { validateEnv } from './env-schema.js';

export const env = validateEnv(process.env);

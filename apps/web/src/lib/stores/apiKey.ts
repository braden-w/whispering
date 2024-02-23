import storedWritable from '@efstajas/svelte-stored-writable';
import { z } from 'zod';

export const apiKey = storedWritable('openai-api-key', z.string(), '');

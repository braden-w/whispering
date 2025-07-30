import type { AssistantConfigSelect } from '@repo/db/schema';

/**
 * Assistant configuration as returned by the API.
 * This is the shape of assistant configs after they've been:
 * 1. Fetched from the database (AssistantConfigSelect)
 * 2. Had their passwords decrypted (EncryptedData → string)
 * 3. Been JSON-serialized (Date → string)
 */
export type AssistantConfig = Omit<AssistantConfigSelect, 'password' | 'createdAt' | 'updatedAt' | 'lastAccessedAt'> & {
	password: string | null; // Decrypted from EncryptedData
	createdAt: string; // ISO date string from JSON serialization
	updatedAt: string;
	lastAccessedAt: string;
};
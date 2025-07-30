import type { CloudflareEnv } from '@repo/constants/cloudflare';
import {
	symmetricEncrypt,
	symmetricDecrypt,
	hashToBase64,
} from 'better-auth/crypto';
import type { Brand } from 'wellcrafted/brand';

/**
 * Encrypted password type for type safety
 */
export type EncryptedPassword = string & Brand<'EncryptedPassword'>;

/**
 * Salt version for key derivation. Increment this when rotating keys.
 */
const SALT = 'epicenter-assistant-password-v1';

/**
 * Purpose identifier for key derivation context
 */
const PURPOSE = 'assistant-password-encryption';

/**
 * Derives a user-specific encryption key for assistant passwords.
 *
 * The key is derived by combining:
 * - Master key from environment (server secret)
 * - Salt version (for key rotation)
 * - User ID (for user isolation)
 * - Purpose (for context separation)
 *
 * @param userId - The user's unique identifier
 * @returns Base64-encoded encryption key
 */
async function deriveKey({
	userId,
	env,
}: { userId: string; env: CloudflareEnv }): Promise<string> {
	const masterKey = env.BETTER_AUTH_SECRET;
	const keyMaterial = `${masterKey}:${SALT}:user:${userId}:${PURPOSE}` as const;
	return hashToBase64(keyMaterial);
}

/**
 * Encrypts an assistant password for secure storage.
 *
 * This function uses symmetric encryption with a user-specific key derived from:
 * - A server-side master key (environment variable)
 * - The user's ID
 * - A versioned salt
 * - A purpose identifier
 *
 * @example
 * ```typescript
 * const encrypted = await encryptAssistantPassword('mySecret123', 'user-123');
 * // Returns: "encrypted:base64data..." (EncryptedPassword type)
 * ```
 *
 * @param password - The plain text password to encrypt
 * @param userId - The user's unique identifier for key derivation
 * @returns Encrypted password with format prefix
 * @throws Error if BETTER_AUTH_SECRET is not set
 */
export async function encryptAssistantPassword({
	password,
	userId,
	env,
}: {
	password: string;
	userId: string;
	env: CloudflareEnv;
}): Promise<EncryptedPassword> {
	const key = await deriveKey({ userId, env });
	const encrypted = await symmetricEncrypt({ key, data: password });
	return encrypted as EncryptedPassword;
}

/**
 * Decrypts an assistant password for use.
 *
 * This function reverses the encryption process to retrieve the original password.
 * It uses the same key derivation process to ensure the correct key is used.
 *
 * @example
 * ```typescript
 * const plain = await decryptAssistantPassword(encryptedPassword, 'user-123');
 * // Returns: "mySecret123"
 * ```
 *
 * @param encryptedPassword - The encrypted password from storage
 * @param userId - The user's unique identifier for key derivation
 * @returns The decrypted plain text password
 * @throws Error if decryption fails or password format is invalid
 */
export async function decryptAssistantPassword({
	encryptedPassword,
	userId,
	env,
}: {
	encryptedPassword: EncryptedPassword;
	userId: string;
	env: CloudflareEnv;
}): Promise<string> {
	const key = await deriveKey({ userId, env });
	return symmetricDecrypt({ key, data: encryptedPassword });
}

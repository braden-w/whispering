import { type } from 'arktype';

// Simple XOR encryption for localStorage
// This is NOT cryptographically secure, but provides basic obfuscation
// For production, consider using Web Crypto API

const ENCRYPTION_KEY = 'opencode-workspace-key-2024';

export const EncryptedPassword = type('string').brand('EncryptedPassword');
export const DecryptedPassword = type('string').brand('DecryptedPassword');

export type EncryptedPassword = typeof EncryptedPassword.inferOut;
export type DecryptedPassword = typeof DecryptedPassword.inferOut;

export function encrypt(text: DecryptedPassword): EncryptedPassword {
	let result = '';
	for (let i = 0; i < text.length; i++) {
		result += String.fromCharCode(
			text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length),
		);
	}
	return btoa(result) as EncryptedPassword; // Base64 encode the result
}

export function decrypt(encrypted: EncryptedPassword): DecryptedPassword {
	try {
		const decoded = atob(encrypted); // Base64 decode
		let result = '';
		for (let i = 0; i < decoded.length; i++) {
			result += String.fromCharCode(
				decoded.charCodeAt(i) ^
					ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length),
			);
		}
		return result as DecryptedPassword;
	} catch {
		// If decryption fails, return empty string
		return '' as DecryptedPassword;
	}
}

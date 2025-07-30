import {
	hashPassword as hashPasswordBetterAuth,
	verifyPassword as verifyPasswordBetterAuth,
} from 'better-auth/crypto';
import type { Brand } from 'wellcrafted/brand';

export type Password = string & Brand<'Password'>;

export async function hashPassword(password: Password): Promise<string> {
	const hashedPassword = await hashPasswordBetterAuth(password);
	return hashedPassword as Password;
}

export async function verifyPassword(
	password: Password,
	hash: string,
): Promise<boolean> {
	return await verifyPasswordBetterAuth({ password, hash });
}

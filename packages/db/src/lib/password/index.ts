import {
	hashPassword as hashPasswordBetterAuth,
	verifyPassword as verifyPasswordBetterAuth,
} from 'better-auth/crypto';
import type { Brand } from 'wellcrafted/brand';

export type Password = string & Brand<'Password'>;
export type PasswordHash = string & Brand<'PasswordHash'>;

export async function hashPassword(password: Password): Promise<PasswordHash> {
	return (await hashPasswordBetterAuth(password)) as PasswordHash;
}

export function verifyPassword({
	password,
	hash,
}: { password: Password; hash: PasswordHash }): Promise<boolean> {
	return verifyPasswordBetterAuth({ password, hash });
}

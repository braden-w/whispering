import { authClient } from '$lib/auth-client';
import * as rpc from '$lib/query';
import { redirect } from '@sveltejs/kit';

export async function load() {
	const { data: session, error: getSessionError } =
		await rpc.auth.getSession.ensure();
	if (getSessionError) redirect(302, '/');

	// If a session exists, return it
	if (session) return { session };

	// No session exists, sign in anonymously
	const { error: anonError } = await authClient.signIn.anonymous();
	if (anonError) redirect(302, '/');

	// Get the new session
	const { data: newSession, error: sessionError } =
		await rpc.auth.getSession.ensure();
	if (sessionError) redirect(302, '/');
	if (!newSession) throw new Error('No session found');
	return { session: newSession };
}

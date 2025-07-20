import type { PageLoad } from './$types';
import * as rpc from '$lib/query';
import { queryClient } from '$lib/query/_client';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
	const { id } = params;

	try {
		// Prefetch session data
		await queryClient.prefetchQuery(rpc.sessions.getSessionById(id).options());
		
		// Prefetch messages for the session
		await queryClient.prefetchQuery(rpc.messages.getMessagesBySessionId(id).options());

		return {
			sessionId: id
		};
	} catch (e) {
		console.error('Error loading session:', e);
		throw error(404, 'Session not found');
	}
};
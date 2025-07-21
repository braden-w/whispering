import * as rpc from '$lib/query';
import { queryClient } from '$lib/query/_client.js';
import { getWorkspaceConfig } from '$lib/stores/workspace-configs.svelte';
import { redirect } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const workspaceConfig = getWorkspaceConfig(params.id);

	if (!workspaceConfig) redirect(302, '/workspaces');

	const sessions = await queryClient.ensureQueryData(
		rpc.sessions
			.getSessionById(
				() => workspaceConfig,
				() => params.sessionId,
			)
			.options(),
	);

	const session = sessions?.find((s) => s.id === params.sessionId);

	if (!session) redirect(302, `/workspaces/${params.id}`);

	// Fetch initial messages
	const messages = await queryClient.ensureQueryData(
		rpc.messages
			.getMessagesBySessionId(
				() => workspaceConfig,
				() => params.sessionId,
			)
			.options(),
	);

	return {
		workspaceConfig,
		sessionId: params.sessionId,
		session,
		messages,
	};
};

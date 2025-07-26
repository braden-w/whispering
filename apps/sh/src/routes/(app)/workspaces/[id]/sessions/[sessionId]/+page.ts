import * as rpc from '$lib/query';
import { workspaceConfigs } from '$lib/stores/workspace-configs.svelte';
import { redirect } from '@sveltejs/kit';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const workspaceConfig = workspaceConfigs.getById(params.id);

	if (!workspaceConfig) redirect(302, '/workspaces');

	const { data: session, error: sessionError } = await rpc.sessions
		.getSessionById(
			() => workspaceConfig,
			() => params.sessionId,
		)
		.ensure();

	if (sessionError) redirect(302, '/workspaces');

	if (!session) redirect(302, `/workspaces/${params.id}`);

	// Fetch initial messages
	const { data: messages, error: messagesError } = await rpc.messages
		.getMessagesBySessionId(
			() => workspaceConfig,
			() => params.sessionId,
		)
		.ensure();

	if (messagesError) redirect(302, `/workspaces/${params.id}`);

	const { data: providers, error: providersError } = await rpc.models
		.getProviders(() => workspaceConfig)
		.ensure();

	if (providersError) redirect(302, `/workspaces/${params.id}`);

	const { data: modes, error: modesError } = await rpc.modes
		.getModes(() => workspaceConfig)
		.ensure();

	if (modesError) redirect(302, `/workspaces/${params.id}`);

	return {
		messages,
		modes,
		providers,
		session,
		sessionId: params.sessionId,
		workspaceConfig,
	};
};

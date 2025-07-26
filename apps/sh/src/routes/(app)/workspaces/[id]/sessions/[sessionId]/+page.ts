import * as rpc from '$lib/query';
import { workspaceConfigs } from '$lib/stores/workspace-configs.svelte';
import { redirectTo } from '$lib/utils/redirect-with-flash-message';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const workspaceConfig = workspaceConfigs.getById(params.id);

	if (!workspaceConfig) {
		redirectTo.workspaces.error({
			title: 'Workspace not found',
			description:
				"The workspace you're looking for doesn't exist. It may have been deleted or you may not have access to it.",
		});
		return;
	}

	const { data: session, error: sessionError } = await rpc.sessions
		.getSessionById(
			() => workspaceConfig,
			() => params.sessionId,
		)
		.ensure();

	if (sessionError) {
		redirectTo.workspace(params.id).error(sessionError);
		return;
	}

	if (!session) {
		redirectTo.workspace(params.id).info({
			title: 'Session not found',
			description:
				"The conversation you're looking for doesn't exist. It may have been deleted or you may have an outdated link.",
		});
		return;
	}

	// Fetch initial messages
	const { data: messages, error: messagesError } = await rpc.messages
		.getMessagesBySessionId(
			() => workspaceConfig,
			() => params.sessionId,
		)
		.ensure();

	if (messagesError) {
		redirectTo.workspace(params.id).error(messagesError);
		return;
	}

	if (!messages) {
		redirectTo.workspace(params.id).error({
			title: 'Failed to load conversation',
			description:
				'Unable to load the messages for this conversation (messages were somehow undefined). Please try again or start a new conversation.',
		});
		return;
	}

	const { data: providers, error: providersError } = await rpc.models
		.getProviders(() => workspaceConfig)
		.ensure();

	if (providersError) {
		redirectTo.workspace(params.id).error(providersError);
		return;
	}

	if (!providers) {
		redirectTo.workspace(params.id).error({
			title: 'Configuration error',
			description:
				'Unable to load AI providers. Please check your workspace configuration and try again.',
		});
		return;
	}

	const { data: modes, error: modesError } = await rpc.modes
		.getModes(() => workspaceConfig)
		.ensure();

	if (modesError) {
		redirectTo.workspace(params.id).error(modesError);
		return;
	}

	if (!modes) {
		redirectTo.workspace(params.id).error({
			title: 'Configuration error',
			description:
				'Unable to load available modes. Please check your workspace configuration and try again.',
		});
		return;
	}

	return {
		messages,
		modes,
		providers,
		session,
		sessionId: params.sessionId,
		workspaceConfig,
	};
};

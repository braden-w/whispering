import * as rpc from '$lib/query';
import { workspaceConfigs } from '$lib/stores/workspace-configs.svelte';
import {
	redirectToWorkspaceWithInfo,
	redirectToWorkspacesWithError,
	redirectToWorkspaceWithError,
} from '$lib/utils/redirects.svelte';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const workspaceConfig = workspaceConfigs.getById(params.id);

	if (!workspaceConfig) {
		redirectToWorkspacesWithError({
			title: 'Workspace not found',
			description:
				"The workspace you're looking for doesn't exist. It may have been deleted or you may not have access to it.",
		});
	}

	const { data: session, error: sessionError } = await rpc.sessions
		.getSessionById(
			() => workspaceConfig,
			() => params.sessionId,
		)
		.ensure();

	if (sessionError) {
		redirectToWorkspaceWithError(params.id, sessionError);
	}

	if (!session) {
		redirectToWorkspaceWithInfo(params.id, {
			title: 'Session not found',
			description:
				"The conversation you're looking for doesn't exist. It may have been deleted or you may have an outdated link.",
		});
	}

	// Fetch initial messages
	const { data: messages, error: messagesError } = await rpc.messages
		.getMessagesBySessionId(
			() => workspaceConfig,
			() => params.sessionId,
		)
		.ensure();

	if (messagesError) {
		redirectToWorkspaceWithError(params.id, messagesError);
	}

	if (!messages) {
		redirectToWorkspaceWithError(params.id, {
			title: 'Failed to load conversation',
			description:
				'Unable to load the messages for this conversation (messages were somehow undefined). Please try again or start a new conversation.',
		});
	}

	const { data: providers, error: providersError } = await rpc.models
		.getProviders(() => workspaceConfig)
		.ensure();

	if (providersError) {
		redirectToWorkspaceWithError(params.id, providersError);
	}

	if (!providers) {
		redirectToWorkspaceWithError(params.id, {
			title: 'Configuration error',
			description:
				'Unable to load AI providers. Please check your workspace configuration and try again.',
		});
	}

	const { data: modes, error: modesError } = await rpc.modes
		.getModes(() => workspaceConfig)
		.ensure();

	if (modesError) {
		redirectToWorkspaceWithError(params.id, modesError);
	}

	if (!modes) {
		redirectToWorkspaceWithError(params.id, {
			title: 'Configuration error',
			description:
				'Unable to load available modes. Please check your workspace configuration and try again.',
		});
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

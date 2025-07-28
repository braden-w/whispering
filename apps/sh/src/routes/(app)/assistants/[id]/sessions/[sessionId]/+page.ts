import * as rpc from '$lib/query';
import { assistantConfigs } from '$lib/stores/assistant-configs.svelte';
import { redirectTo } from '$lib/utils/redirect-with-flash-message';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const assistantConfig = assistantConfigs.getById(params.id);

	if (!assistantConfig) {
		redirectTo.assistants.error({
			title: 'Assistant not found',
			description:
				"The assistant you're looking for doesn't exist. It may have been deleted or you may not have access to it.",
		});
		return;
	}

	const { data: session, error: sessionError } = await rpc.sessions
		.getSessionById(
			() => assistantConfig,
			() => params.sessionId,
		)
		.ensure();

	if (sessionError) {
		redirectTo.assistant(params.id).error(sessionError);
		return;
	}

	if (!session) {
		redirectTo.assistant(params.id).info({
			title: 'Session not found',
			description:
				"The conversation you're looking for doesn't exist. It may have been deleted or you may have an outdated link.",
		});
		return;
	}

	// Fetch initial messages
	const { data: messages, error: messagesError } = await rpc.messages
		.getMessagesBySessionId(
			() => assistantConfig,
			() => params.sessionId,
		)
		.ensure();

	if (messagesError) {
		redirectTo.assistant(params.id).error(messagesError);
		return;
	}

	if (!messages) {
		redirectTo.assistant(params.id).error({
			title: 'Failed to load conversation',
			description:
				'Unable to load the messages for this conversation (messages were somehow undefined). Please try again or start a new conversation.',
		});
		return;
	}

	const { data: providers, error: providersError } = await rpc.models
		.getProviders(() => assistantConfig)
		.ensure();

	if (providersError) {
		redirectTo.assistant(params.id).error(providersError);
		return;
	}

	if (!providers) {
		redirectTo.assistant(params.id).error({
			title: 'Configuration error',
			description:
				'Unable to load AI providers. Please check your assistant configuration and try again.',
		});
		return;
	}

	const { data: modes, error: modesError } = await rpc.modes
		.getModes(() => assistantConfig)
		.ensure();

	if (modesError) {
		redirectTo.assistant(params.id).error(modesError);
		return;
	}

	if (!modes) {
		redirectTo.assistant(params.id).error({
			title: 'Configuration error',
			description:
				'Unable to load available modes. Please check your assistant configuration and try again.',
		});
		return;
	}

	return {
		messages,
		modes,
		providers,
		session,
		sessionId: params.sessionId,
		assistantConfig,
	};
};

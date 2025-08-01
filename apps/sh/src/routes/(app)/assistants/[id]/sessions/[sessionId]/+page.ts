import * as rpc from '$lib/query';
import { assistantConfigs } from '$lib/stores/assistant-configs.svelte';
import { redirectTo } from '$lib/utils/redirect-with-flash-message';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const assistantConfig = assistantConfigs.getById(params.id);

	if (!assistantConfig) {
		throw redirectTo.assistants.error({
			title: 'Assistant not found',
			description:
				"The assistant you're looking for doesn't exist. It may have been deleted or you may not have access to it.",
		});
	}

	const { data: sessions, error: sessionError } = await rpc.sessions
		.getSessionById(
			() => assistantConfig,
			() => params.sessionId,
		)
		.ensure();

	if (sessionError) {
		throw redirectTo.assistant(params.id).error(sessionError);
	}

	const session = sessions?.find((s) => s.id === params.sessionId);

	if (!session) {
		throw redirectTo.assistant(params.id).info({
			title: 'Session not found',
			description:
				"The conversation you're looking for doesn't exist. It may have been deleted or you may have an outdated link.",
		});
	}

	// Fetch initial messages
	const { data: messages, error: messagesError } = await rpc.messages
		.getMessagesBySessionId(
			() => assistantConfig,
			() => params.sessionId,
		)
		.ensure();

	if (messagesError) {
		throw redirectTo.assistant(params.id).error(messagesError);
	}

	if (!messages) {
		throw redirectTo.assistant(params.id).error({
			title: 'Failed to load conversation',
			description:
				'Unable to load the messages for this conversation (messages were somehow undefined). Please try again or start a new conversation.',
		});
	}

	const { data: providers, error: providersError } = await rpc.models
		.getProviders(() => assistantConfig)
		.ensure();

	if (providersError) {
		throw redirectTo.assistant(params.id).error(providersError);
	}

	if (!providers) {
		throw redirectTo.assistant(params.id).error({
			title: 'Configuration error',
			description:
				'Unable to load AI providers. Please check your assistant configuration and try again.',
		});
	}

	const { data: modes, error: modesError } = await rpc.modes
		.getModes(() => assistantConfig)
		.ensure();

	if (modesError) {
		throw redirectTo.assistant(params.id).error(modesError);
	}

	if (!modes) {
		throw redirectTo.assistant(params.id).error({
			title: 'Configuration error',
			description:
				'Unable to load available modes. Please check your assistant configuration and try again.',
		});
	}

	return {
		assistantConfig,
		messages,
		modes,
		providers,
		session,
		sessionId: params.sessionId,
	};
};

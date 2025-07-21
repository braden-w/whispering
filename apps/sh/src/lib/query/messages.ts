import type { PostSessionByIdMessageData } from '$lib/client/types.gen';
import type { WorkspaceConfig } from '$lib/stores/workspace-configs.svelte';
import type { Accessor } from '@tanstack/svelte-query';

import { createWorkspaceClient } from '$lib/client/client.gen';
import * as api from '$lib/client/sdk.gen';
import { ShErr } from '$lib/result';
import { extractErrorMessage } from 'wellcrafted/error';
import { Ok } from 'wellcrafted/result';

import { defineMutation, defineQuery } from './_client';

// Query for fetching messages by session ID
export const getMessagesBySessionId = (
	workspaceConfig: Accessor<WorkspaceConfig>,
	sessionId: Accessor<string>,
) =>
	defineQuery({
		queryKey: [
			'workspaces',
			workspaceConfig().id,
			'sessions',
			sessionId(),
			'messages',
		],
		resultQueryFn: async () => {
			const client = createWorkspaceClient(workspaceConfig());

			const { data, error } = await api.getSessionByIdMessage({
				client,
				path: { id: sessionId() },
			});

			if (error) {
				return ShErr({
					description: extractErrorMessage(error),
					title: 'Failed to fetch messages',
				});
			}

			return Ok(data);
		},
	});

// Mutation for sending a message
export const sendMessage = defineMutation({
	mutationKey: ['sendMessage'],
	resultMutationFn: async ({
		body,
		sessionId,
		workspaceConfig,
	}: {
		body: PostSessionByIdMessageData['body'];
		sessionId: string;
		workspaceConfig: WorkspaceConfig;
	}) => {
		const client = createWorkspaceClient(workspaceConfig);

		// TODO: Provider and model should come from workspace settings or user preferences
		// For now, we'll use default values
		const { data, error } = await api.postSessionByIdMessage({
			body,
			client,
			path: { id: sessionId },
		});

		if (error) {
			return ShErr({
				description: extractErrorMessage(error),
				title: 'Failed to send message',
			});
		}
		return Ok(data);
	},
});

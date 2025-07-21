import * as api from '$lib/client/sdk.gen';
import type { PostSessionByIdMessageData } from '$lib/client/types.gen';
import { createWorkspaceClient } from '$lib/client/client.gen';
import { ShErr } from '$lib/result';
import type { WorkspaceConfig } from '$lib/stores/workspace-configs.svelte';
import type { Accessor } from '@tanstack/svelte-query';
import { extractErrorMessage } from 'wellcrafted/error';
import { Ok } from 'wellcrafted/result';
import { defineQuery, defineMutation } from './_client';

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
					title: 'Failed to fetch messages',
					description: extractErrorMessage(error),
				});
			}

			return Ok(data);
		},
	});

// Mutation for sending a message
export const sendMessage = defineMutation({
	mutationKey: ['sendMessage'],
	resultMutationFn: async ({
		workspaceConfig,
		sessionId,
		body,
	}: {
		workspaceConfig: WorkspaceConfig;
		sessionId: string;
		body: PostSessionByIdMessageData['body'];
	}) => {
		const client = createWorkspaceClient(workspaceConfig);

		// TODO: Provider and model should come from workspace settings or user preferences
		// For now, we'll use default values
		const { data, error } = await api.postSessionByIdMessage({
			client,
			path: { id: sessionId },
			body,
		});

		if (error) {
			return ShErr({
				title: 'Failed to send message',
				description: extractErrorMessage(error),
			});
		}
		return Ok(data);
	},
});

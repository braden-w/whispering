import * as api from '$lib/client/sdk.gen';
import type {
	Message,
	PostSessionByIdMessageData,
} from '$lib/client/types.gen';
import { createWorkspaceClient } from '$lib/client/workspace-client';
import { ShErr } from '$lib/result';
import type { Workspace } from '$lib/stores/workspaces.svelte';
import type { Accessor } from '@tanstack/svelte-query';
import { extractErrorMessage } from 'wellcrafted/error';
import { Ok } from 'wellcrafted/result';
import { defineMutation, defineQuery, queryClient } from './_client';

export const getMessagesBySessionId = (
	workspace: Accessor<Workspace>,
	sessionId: Accessor<string>,
) =>
	defineQuery({
		queryKey: [
			'workspaces',
			workspace().id,
			'sessions',
			sessionId(),
			'messages',
		],
		resultQueryFn: async () => {
			const client = createWorkspaceClient(workspace());

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
			return Ok(data ?? []);
		},
		refetchInterval: 2000, // Poll every 2 seconds for real-time updates
	});

// Mutation for sending a message to a session
export const sendMessage = defineMutation({
	mutationKey: ['sendMessage'],
	resultMutationFn: async ({
		workspace,
		sessionId,
		body,
	}: {
		workspace: Workspace;
		sessionId: string;
		body: PostSessionByIdMessageData['body'];
	}) => {
		const client = createWorkspaceClient(workspace);

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
	onSettled: (_, __, { workspace, sessionId }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspace.id, 'sessions', sessionId, 'messages'],
		});
	},
});

// Helper function to check if a message is still being processed
export function isMessageProcessing(message: Message): boolean {
	if (message.role !== 'assistant') return false;

	const assistantMessage = message as any; // Type assertion for assistant message
	return !assistantMessage.time?.completed;
}

// Helper function to get the latest assistant message
export function getLatestAssistantMessage(messages: Message[]): Message | null {
	const assistantMessages = messages.filter((m) => m.role === 'assistant');
	return assistantMessages[assistantMessages.length - 1] || null;
}

// Helper function to check if the session is currently processing
export function isSessionProcessing(messages: Message[]): boolean {
	const latestAssistant = getLatestAssistantMessage(messages);
	return latestAssistant ? isMessageProcessing(latestAssistant) : false;
}

// Helper to format message timestamp
export function formatMessageTime(timestamp: number): string {
	const date = new Date(timestamp);
	const now = new Date();
	const diff = now.getTime() - date.getTime();

	// If less than 1 minute ago
	if (diff < 60000) {
		return 'just now';
	}

	// If less than 1 hour ago
	if (diff < 3600000) {
		const minutes = Math.floor(diff / 60000);
		return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
	}

	// If today
	if (date.toDateString() === now.toDateString()) {
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		});
	}

	// Otherwise show date and time
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
	});
}

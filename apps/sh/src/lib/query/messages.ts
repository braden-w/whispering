import * as api from '$lib/client';
import type { Message, UserMessagePart } from '$lib/client/types.gen';
import { ShErr } from '$lib/result';
import type { Accessor } from '@tanstack/svelte-query';
import { extractErrorMessage } from 'wellcrafted/error';
import { Ok } from 'wellcrafted/result';
import { defineMutation, defineQuery, queryClient } from './_client';

// Query for fetching messages for a session
export const getMessagesBySessionId = (sessionId: Accessor<string> | string) =>
	defineQuery({
		queryKey: () => ['messages', typeof sessionId === 'function' ? sessionId() : sessionId],
		resultQueryFn: async () => {
			const id = typeof sessionId === 'function' ? sessionId() : sessionId;
			const { data, error } = await api.getSessionByIdMessage({
				path: { id },
			});
			if (error) {
				return ShErr({
					title: 'Failed to fetch messages',
					description: extractErrorMessage(error),
				});
			}
			return Ok(data || []);
		},
		refetchInterval: 2000, // Poll every 2 seconds for real-time updates
		staleTime: 0, // Always considered stale to ensure fresh data
	});

// Mutation for sending a message to a session
export const sendMessage = defineMutation({
	mutationKey: ['sendMessage'],
	resultMutationFn: async ({
		sessionId,
		content,
	}: { sessionId: string; content: string | UserMessagePart[] }) => {
		const parts: UserMessagePart[] =
			typeof content === 'string' ? [{ type: 'text', text: content }] : content;

		const { data, error } = await api.postSessionByIdMessage({
			path: { id: sessionId },
			body: {
				providerID: 'openai',
				modelID: 'gpt-4o',
				mode: 'chat',
				parts,
			},
		});

		if (error) {
			return ShErr({
				title: 'Failed to send message',
				description: extractErrorMessage(error),
			});
		}
		return Ok(data);
	},
	onMutate: async ({ sessionId, content }) => {
		// Cancel any outgoing refetches
		await queryClient.cancelQueries({ queryKey: ['messages', sessionId] });

		// Snapshot the previous value
		const previousMessages = queryClient.getQueryData<Message[]>([
			'messages',
			sessionId,
		]);

		// Optimistically update to the new value
		const optimisticMessage: Message = {
			id: `temp-${Date.now()}`,
			sessionID: sessionId,
			role: 'user',
			parts:
				typeof content === 'string'
					? [{ type: 'text', text: content, synthetic: false }]
					: content,
			time: {
				created: Date.now(),
			},
		};

		queryClient.setQueryData<Message[]>(['messages', sessionId], (old) => [
			...(old || []),
			optimisticMessage,
		]);

		// Return a context object with the snapshotted value
		return { previousMessages };
	},
	onError: (_, { sessionId }, context) => {
		// If the mutation fails, use the context returned from onMutate to roll back
		if (context?.previousMessages) {
			queryClient.setQueryData(
				['messages', sessionId],
				context.previousMessages,
			);
		}
	},
	onSettled: ({ sessionId }) => {
		// Always refetch after error or success
		queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
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

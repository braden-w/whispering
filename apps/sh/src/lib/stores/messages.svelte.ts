import * as api from '$lib/client/sdk.gen';
import type {
	AssistantMessage,
	EventMessagePartUpdated,
	EventMessageRemoved,
	EventMessageUpdated,
	Message as MessageInfo,
	Part,
} from '$lib/client/types.gen';
import { createWorkspaceClient } from '$lib/client/client.gen';
import type { WorkspaceConfig } from '$lib/stores/workspace-configs.svelte';
import type { Accessor } from '@tanstack/svelte-query';
import { createSubscriber } from 'svelte/reactivity';

export type Message = { info: MessageInfo; parts: Part[] };

/**
 * Creates a reactive message subscriber that combines initial fetch with SSE updates
 *
 * @param workspace - Accessor to the workspace configuration
 * @param sessionId - Accessor to the session ID
 * @returns A reactive value containing the messages with their parts
 *
 * @example
 * ```ts
 * const messages = createMessageSubscriber(
 *   () => currentWorkspace,
 *   () => sessionId
 * );
 *
 * // Use in component
 * $effect(() => {
 *   console.log('Messages:', messages.value);
 * });
 * ```
 */
export function createMessageSubscriber(
	workspace: Accessor<WorkspaceConfig>,
	sessionId: Accessor<string>,
) {
	// Using the exact type returned by the API: Array<{ info: Message; parts: Array<Part> }>
	let messages = $state<Message[]>([]);
	let eventSource: EventSource | null = null;

	/**
	 * Replaces an existing message or appends a new one to the messages array
	 *
	 * @param updatedMessage - The complete message object to update or add
	 *
	 * @remarks
	 * This is typically used when receiving a `message.updated` event which contains
	 * the full message state. If a message with the same ID exists, it will be
	 * replaced entirely while preserving its parts. Otherwise, the message is
	 * appended to the end of the array with empty parts.
	 */
	function upsertMessage(updatedMessage: MessageInfo) {
		const existingIndex = messages.findIndex(
			(msg) => msg.info.id === updatedMessage.id,
		);

		if (existingIndex >= 0) {
			// Preserve existing parts when updating message info
			messages = [
				...messages.slice(0, existingIndex),
				{
					info: updatedMessage,
					parts: messages[existingIndex].parts,
				},
				...messages.slice(existingIndex + 1),
			];
		} else {
			// Add new message with empty parts array
			messages = [
				...messages,
				{
					info: updatedMessage,
					parts: [],
				},
			];
		}
	}

	/**
	 * Merges a streaming message part into an existing message's parts array
	 *
	 * @param messageId - The ID of the message to update
	 * @param part - The message part to merge (text, tool, or step marker)
	 *
	 * @remarks
	 * This handles the streaming nature of assistant responses:
	 * - Text parts: Concatenates consecutive text chunks into a single part to avoid fragmentation
	 * - Tool parts: Updates existing tool calls by ID or appends new ones
	 * - Step markers: Always appends to maintain chronological order
	 *
	 * @example
	 * // Streaming text chunks get concatenated:
	 * // Part 1: { type: 'text', text: 'Hello' }
	 * // Part 2: { type: 'text', text: ' world' }
	 * // Result: [{ type: 'text', text: 'Hello world' }]
	 */
	function mergeStreamingPart(messageId: string, part: Part) {
		messages = messages.map((msg) => {
			if (msg.info.id !== messageId || msg.info.role !== 'assistant')
				return msg;

			// Handle different part types
			if (part.type === 'text') {
				// For text parts, check if we should append or add new
				const lastPart = msg.parts[msg.parts.length - 1];

				if (lastPart?.type === 'text' && !part.synthetic) {
					// Append to the last text part if it exists and the new part is not synthetic
					const updatedParts = [...msg.parts];
					updatedParts[updatedParts.length - 1] = {
						...lastPart,
						text: lastPart.text + part.text,
					};
					return { ...msg, parts: updatedParts };
				}
				// Add as new part
				return { ...msg, parts: [...msg.parts, part] };
			}

			// For tool parts, update by ID or append
			if (part.type === 'tool') {
				const existingIndex = msg.parts.findIndex(
					(p) => p.type === 'tool' && p.id === part.id,
				);

				if (existingIndex >= 0) {
					const updatedParts = [...msg.parts];
					updatedParts[existingIndex] = part;
					return { ...msg, parts: updatedParts };
				}
				return { ...msg, parts: [...msg.parts, part] };
			}

			// For other part types (step-start, step-finish, snapshot, file), just append
			return { ...msg, parts: [...msg.parts, part] };
		});
	}

	/**
	 * Removes a message from the messages array by ID
	 *
	 * @param messageId - The ID of the message to remove
	 *
	 * @remarks
	 * Used when receiving a `message.removed` event, typically when:
	 * - A message is deleted by the user
	 * - An error message is cleared
	 * - A message is reverted/regenerated
	 */
	function deleteMessageById(messageId: string) {
		messages = messages.filter((m) => m.info.id !== messageId);
	}

	/**
	 * Fetches all messages for the current session from the server
	 *
	 * @remarks
	 * This provides the initial state when:
	 * - First loading a session
	 * - Reconnecting after connection loss
	 * - Workspace or session ID changes
	 *
	 * @returns Promise that resolves when messages are loaded
	 */
	async function loadInitialMessages() {
		const client = createWorkspaceClient(workspace());
		const { data, error } = await api.getSessionByIdMessage({
			client,
			path: { id: sessionId() },
		});

		if (!error && data) {
			// data is already Array<{ info: Message; parts: Part[] }>
			messages = data;
		}
	}

	/**
	 * Safely parses JSON data from an SSE event
	 *
	 * @param event - The MessageEvent from EventSource
	 * @returns Parsed data or null if parsing fails
	 *
	 * @remarks
	 * We don't constrain the type parameter since the generated event types
	 * have generic string types rather than literal types
	 */
	function parseEventData<T>(event: MessageEvent): T | null {
		try {
			return JSON.parse(event.data) as T;
		} catch (err) {
			console.error('Failed to parse SSE event:', err);
			return null;
		}
	}

	// Subscribe to reactive updates
	const subscribe = createSubscriber((update) => {
		if (eventSource) {
			eventSource.close();
		}

		// Construct SSE URL with authentication
		// Since EventSource doesn't support headers, we need to use Basic Auth in URL
		// const sseUrl = new URL('/event', workspace().url);
		// sseUrl.username = workspace().username;
		// sseUrl.password = workspace().password;
		const sseUrl = new URL('/event', 'http://localhost:8080');

		eventSource = new EventSource(sseUrl.toString());

		// Handle message updates
		eventSource.addEventListener('message.updated', (event) => {
			const data = parseEventData<EventMessageUpdated>(event);
			if (data && data.properties.info.sessionID === sessionId()) {
				upsertMessage(data.properties.info);
				update();
			}
		});

		// Handle message part updates (streaming)
		eventSource.addEventListener('message.part.updated', (event) => {
			const data = parseEventData<EventMessagePartUpdated>(event);
			// Parts have their own sessionID and messageID
			if (data && data.properties.part.sessionID === sessionId()) {
				mergeStreamingPart(
					data.properties.part.messageID,
					data.properties.part,
				);
				update();
			}
		});

		// Handle message removal
		eventSource.addEventListener('message.removed', (event) => {
			const data = parseEventData<EventMessageRemoved>(event);
			if (data && data.properties.sessionID === sessionId()) {
				deleteMessageById(data.properties.messageID);
				update();
			}
		});

		// Handle connection errors
		eventSource.onerror = (error) => {
			console.error('SSE connection error:', error);
			// TODO: Implement exponential backoff reconnection
		};

		// Cleanup
		return () => {
			if (eventSource) {
				eventSource.close();
				eventSource = null;
			}
		};
	});

	return {
		get value() {
			subscribe();
			return messages;
		},
		loadInitialMessages,
	};
}

/**
 * Determines if an assistant message is still being generated/streamed
 *
 * @param message - The message to check
 * @returns True if the message is an assistant message without a completion timestamp
 *
 * @remarks
 * Assistant messages have a `time.completed` field that is:
 * - `undefined` while the message is being generated
 * - Set to a timestamp when generation completes
 *
 * @example
 * ```ts
 * if (isMessageProcessing(lastMessage)) {
 *   showTypingIndicator();
 * }
 * ```
 */
export function isMessageProcessing(message: MessageInfo | AssistantMessage): boolean {
	if (message.role !== 'assistant') return false;
	return !('completed' in message.time && message.time.completed);
}

/**
 * Checks if any message in the session is currently being processed
 *
 * @param messages - Array of messages to check
 * @returns True if at least one assistant message is still processing
 *
 * @remarks
 * Useful for:
 * - Disabling the input while AI is responding
 * - Showing session-level loading states
 * - Preventing concurrent message submissions
 *
 * @example
 * ```ts
 * const isProcessing = isSessionProcessing(messages.value);
 * <button disabled={isProcessing}>Send</button>
 * ```
 */
export function isSessionProcessing(messages: Message[]): boolean {
	return messages.some((msg) => isMessageProcessing(msg.info));
}

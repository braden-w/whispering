import * as api from '$lib/client/sdk.gen';
import type {
	Message,
	AssistantMessage,
	EventMessageUpdated,
	EventMessagePartUpdated,
	EventMessageRemoved,
	Event,
} from '$lib/client/types.gen';
import { createWorkspaceClient } from '$lib/client/workspace-client';
import type { Workspace } from '$lib/stores/workspaces.svelte';
import type { Accessor } from '@tanstack/svelte-query';
import { createSubscriber } from 'svelte/reactivity';

/**
 * Creates a reactive message subscriber that combines initial fetch with SSE updates
 *
 * @param workspace - Accessor to the workspace configuration
 * @param sessionId - Accessor to the session ID
 * @returns A reactive value containing the messages array
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
	workspace: Accessor<Workspace>,
	sessionId: Accessor<string>,
) {
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
	 * replaced entirely. Otherwise, the message is appended to the end of the array.
	 */
	function upsertMessage(updatedMessage: Message) {
		const existingIndex = messages.findIndex(
			(msg) => msg.id === updatedMessage.id,
		);

		if (existingIndex >= 0) {
			messages = [
				...messages.slice(0, existingIndex),
				updatedMessage,
				...messages.slice(existingIndex + 1),
			];
		} else {
			messages = [...messages, updatedMessage];
		}
	}

	/**
	 * Merges a streaming message part into an existing assistant message
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
	function mergeStreamingPart(
		messageId: string,
		part: EventMessagePartUpdated['properties']['part'],
	) {
		messages = messages.map((msg) => {
			if (msg.id !== messageId || msg.role !== 'assistant') return msg;

			// Handle different part types
			if (part.type === 'text') {
				// For text parts, check if we should append or add new
				const lastPart = msg.parts[msg.parts.length - 1];

				if (lastPart?.type === 'text' && !('id' in lastPart)) {
					// Append to the last text part if it exists
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

			// For step-start and step-finish, just append
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
		messages = messages.filter((m) => m.id !== messageId);
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

	/**
	 * Establishes an SSE connection to receive real-time message updates
	 *
	 * @remarks
	 * Creates an EventSource connection with:
	 * - Basic auth credentials embedded in URL (EventSource limitation)
	 * - Event listeners for message updates, streaming parts, and deletions
	 * - Automatic cleanup of previous connections
	 *
	 * TODO: Add exponential backoff reconnection on errors
	 */
	function establishSSEConnection() {
		if (eventSource) {
			eventSource.close();
		}

		// Construct SSE URL with authentication
		// Since EventSource doesn't support headers, we need to use Basic Auth in URL
		const sseUrl = new URL('/event', workspace().url);
		sseUrl.username = workspace().username;
		sseUrl.password = workspace().password;

		eventSource = new EventSource(sseUrl.toString());

		// Handle message updates
		eventSource.addEventListener('message.updated', (event) => {
			const data = parseEventData<EventMessageUpdated>(event);
			if (data && data.properties.info.sessionID === sessionId()) {
				upsertMessage(data.properties.info);
			}
		});

		// Handle message part updates (streaming)
		eventSource.addEventListener('message.part.updated', (event) => {
			const data = parseEventData<EventMessagePartUpdated>(event);
			if (data && data.properties.sessionID === sessionId()) {
				mergeStreamingPart(data.properties.messageID, data.properties.part);
			}
		});

		// Handle message removal
		eventSource.addEventListener('message.removed', (event) => {
			const data = parseEventData<EventMessageRemoved>(event);
			if (data && data.properties.sessionID === sessionId()) {
				deleteMessageById(data.properties.messageID);
			}
		});

		// Handle connection errors
		eventSource.onerror = (error) => {
			console.error('SSE connection error:', error);
			// TODO: Implement exponential backoff reconnection
		};
	}

	// Subscribe to reactive updates
	const subscribe = createSubscriber((update) => {
		// Initial fetch
		loadInitialMessages();

		// Set up SSE
		establishSSEConnection();

		// Re-fetch and re-subscribe when dependencies change
		$effect(() => {
			workspace(); // Track workspace changes
			sessionId(); // Track session changes

			// Re-fetch and re-subscribe
			loadInitialMessages();
			establishSSEConnection();
			update();
		});

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
export function isMessageProcessing(message: Message): boolean {
	if (message.role !== 'assistant') return false;
	const assistantMsg = message as AssistantMessage;
	return !assistantMsg.time?.completed;
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
	return messages.some(isMessageProcessing);
}

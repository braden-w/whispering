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
 * Creates a reactive message subscriber for real-time SSE updates
 *
 * @param params - Configuration object containing workspace, sessionId, and initial messages
 * @param params.workspace - Accessor to the workspace configuration
 * @param params.sessionId - Accessor to the session ID
 * @param params.initialMessages - Accessor to pre-fetched messages from the load function
 * @returns A reactive value containing the messages with their parts
 *
 * @remarks
 * This subscriber is responsible for keeping messages in sync after the initial load.
 * The initial messages must be fetched separately in the load function using the query layer.
 *
 * @example
 * ```ts
 * const messages = createMessageSubscriber({
 *   workspace: () => workspaceConfig,
 *   sessionId: () => session.id,
 *   initialMessages: () => data.messages
 * });
 *
 * // Use in component
 * $effect(() => {
 *   console.log('Messages:', messages.value);
 * });
 * ```
 */
export function createMessageSubscriber({
	workspace,
	sessionId,
	initialMessages,
}: {
	workspace: Accessor<WorkspaceConfig>;
	sessionId: Accessor<string>;
	initialMessages: Accessor<Message[]>;
}) {
	// Initialize with pre-fetched messages
	let messages = $state<Message[]>(initialMessages());
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
		const sseUrl = new URL('/event', workspace().url);

		console.log('Creating EventSource connection to:', sseUrl.toString());

		eventSource = new EventSource(sseUrl.toString());

		// Handle connection open
		eventSource.onopen = () => {
			console.log('SSE connection opened successfully');
		};

		// Handle all SSE events (server sends everything as 'message' events)
		eventSource.onmessage = (event) => {
			console.log('Received SSE message:', event.data);
			
			const eventData = parseEventData<any>(event);
			if (!eventData) {
				console.log('Failed to parse event data');
				return;
			}

			console.log('Event type:', eventData.type);

			// Route events based on type
			switch (eventData.type) {
				case 'message.updated': {
					console.log('Processing message.updated event');
					const data = eventData as EventMessageUpdated;
					if (data.properties.info.sessionID === sessionId()) {
						console.log('Processing message update for session:', sessionId());
						upsertMessage(data.properties.info);
						update();
					} else {
						console.log('Ignoring message update - session mismatch');
					}
					break;
				}

				case 'message.part.updated': {
					console.log('Processing message.part.updated event');
					const data = eventData as EventMessagePartUpdated;
					if (data.properties.part.sessionID === sessionId()) {
						console.log('Processing part update for session:', sessionId(), 'message:', data.properties.part.messageID);
						mergeStreamingPart(
							data.properties.part.messageID,
							data.properties.part,
						);
						update();
					} else {
						console.log('Ignoring part update - session mismatch');
					}
					break;
				}

				case 'message.removed': {
					console.log('Processing message.removed event');
					const data = eventData as EventMessageRemoved;
					if (data.properties.sessionID === sessionId()) {
						console.log('Processing message removal for session:', sessionId());
						deleteMessageById(data.properties.messageID);
						update();
					} else {
						console.log('Ignoring message removal - session mismatch');
					}
					break;
				}

				default:
					console.log('Unhandled event type:', eventData.type);
					break;
			}
		};

		// Handle connection errors
		eventSource.onerror = (error) => {
			console.error(
				'SSE connection error:',
				error,
				'ReadyState:',
				eventSource?.readyState,
			);
			if (eventSource?.readyState === EventSource.CLOSED) {
				console.error('SSE connection closed unexpectedly');
			}
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
export function isMessageProcessing(
	message: MessageInfo | AssistantMessage,
): boolean {
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

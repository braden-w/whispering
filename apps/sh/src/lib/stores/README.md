# Message Store Architecture

## Overview

The message store handles real-time messaging for the Epicenter.sh application. It manages the relationship between messages and their parts, providing a reactive interface for UI components.

## Understanding Messages and Parts

A message contains multiple parts. Think of it like this:

- **Message**: The container with metadata (who sent it, when, costs, etc.)
- **Parts**: The actual content pieces (text, tool calls, files, etc.)

For example, an assistant response might have:

```
Message (from: assistant, time: 10:00am)
├── TextPart: "Let me search for that..."
├── ToolPart: search(query="react hooks") [running]
├── TextPart: "I found 3 results:"
└── TextPart: "1. useEffect - manages side effects..."
```

## Type Structure

```typescript
// Message combines metadata with content parts
export type Message = {
	info: MessageInfo; // The metadata (id, role, timestamps, etc.)
	parts: Part[]; // The content pieces
};
```

## How It Works

### Initial Load

Messages are fetched in the SvelteKit load function using the query layer, then passed to the message subscriber.

### Real-time Updates

The store listens to Server-Sent Events (SSE) for live updates:

- **message.updated**: Updates message metadata (timestamps, costs, etc.)
- **message.part.updated**: Streams new content parts as the assistant responds
- **message.removed**: Removes messages when deleted

### Streaming Text

Assistant responses stream in as multiple text parts. The store intelligently merges consecutive text parts to avoid fragmentation:

```
Part 1: "Hello"
Part 2: " world"
Result: "Hello world"
```

## Usage

```typescript
// In your +page.ts load function
import * as rpc from '$lib/query';

export const load = async ({ params }) => {
	// Fetch initial messages
	const { data: messages, error } = await rpc.messages
		.getMessagesBySessionId(
			() => assistantConfig,
			() => params.sessionId,
		)
		.ensure();

	if (error) redirect(302, '/assistants');

	return {
		messages,
		// ... other data
	};
};

// In your +page.svelte component
import { createMessageSubscriber } from '$lib/stores/messages.svelte';

const messages = createMessageSubscriber({
	assistant: () => assistantConfig,
	sessionId: () => session.id,
	initialMessages: () => data.messages ?? [],
});

// Access messages in your component
$inspect(messages.value);
```

## Helper Functions

### `isMessageProcessing(message)`

Checks if an assistant message is still being generated (no completion timestamp yet).

### `isSessionProcessing(messages)`

Checks if any message in the session is currently being processed. Useful for disabling inputs while the AI is responding.

## Component Integration

Components receive messages in the complete format with both info and parts:

```svelte
<MessageList messages={messages.value} />

<!-- Inside MessageList -->
{#each messages as message}
	<MessageBubble message={message.info} parts={message.parts} />
{/each}
```

# Query Layer Documentation

This directory contains the TanStack Query wrappers for the OpenCode API, following the wellcrafted patterns.

## Import Pattern

Always use namespace imports when importing query functions:

```typescript
import * as rpc from '$lib/query';
```

## Query Usage

All queries return a function that must be called to get the query definition. When using with `createQuery`, you need to access the `.options` property:

```typescript
// In a Svelte component
import { createQuery } from '@tanstack/svelte-query';
import * as rpc from '$lib/query';

// For queries without parameters
const sessionsQuery = createQuery(rpc.sessions.getSessions.options);

// For queries with parameters
const sessionQuery = createQuery(
	rpc.sessions.getSessionById(sessionId).options,
);
const messagesQuery = createQuery(
	rpc.messages.getMessagesBySessionId(sessionId).options,
);
```

## Mutation Usage

### In Svelte Components

When using mutations in Svelte components, prefer `createMutation` from TanStack Query. This provides pending states and better integration with the component lifecycle.

**Important**: Pass `onSuccess` and `onError` as the second argument to `.mutate()` for maximum context:

```typescript
// In a Svelte component
import { createMutation } from '@tanstack/svelte-query';
import * as rpc from '$lib/query';

// Create mutation with just .options (no parentheses!)
const createSessionMutation = createMutation(rpc.sessions.createSession.options);

// Local state accessible in callbacks
let isModalOpen = $state(false);

// Use the mutation with callbacks in .mutate()
createSessionMutation.mutate(
	{ body: { title: 'New Session' } },
	{
		onSuccess: (data) => {
			// Access local state and context
			isModalOpen = false;
			toast.success('Session created successfully');
			// Navigate to the new session
			goto(`/sessions/${data.id}`);
		},
		onError: (error) => {
			toast.error(error.title, {
				description: error.description,
			});
		},
	}
);

// Access loading state
{#if createSessionMutation.isPending}
	<Spinner />
{/if}
```

### In TypeScript Files

In `.ts` files (load functions, utilities, etc.), use the `.execute()` method:

```typescript
// In a .ts file
const result = await rpc.sessions.createSession.execute({
	body: { title: 'New Session' },
});

// Handle the result using destructuring
const { data, error } = result;
if (error) {
	toast.error(error.title, {
		description: error.description,
	});
} else if (data) {
	toast.success('Session created successfully');
	// Use data for the success response
}
```

### When to Use Each Pattern

- **Use `createMutation` in `.svelte` files** when you need:
  - Loading/pending states (`isPending`, `isSuccess`, `isError`)
  - Automatic component lifecycle integration
  - Built-in error and success callbacks
  - Mutation state management

- **Use `.execute()` in `.svelte` files** only when:
  - You don't need loading states
  - You're performing one-off operations
  - You need fine-grained control over the async flow

- **Always use `.execute()` in `.ts` files** since createMutation requires component context

## Prefetching in Load Functions

When prefetching queries in SvelteKit load functions, call `.options()` as a function:

```typescript
// +page.ts
import type { PageLoad } from './$types';
import * as rpc from '$lib/query';
import { queryClient } from '$lib/query/_client';

export const load: PageLoad = async ({ params }) => {
	// Prefetch queries on the server
	await queryClient.prefetchQuery(rpc.sessions.getSessions.options());

	// With parameters
	await queryClient.prefetchQuery(
		rpc.sessions.getSessionById(params.id).options(),
	);

	return {};
};
```

## Available Queries

### Sessions

- `rpc.sessions.getSessions` - Fetch all sessions
- `rpc.sessions.getSessionById(id)` - Fetch a specific session

### Messages

- `rpc.messages.getMessagesBySessionId(sessionId)` - Fetch messages for a session

### Assistants

- `rpc.assistants.getAssistants` - Fetch all assistant configs and check their connection status
- `rpc.assistants.getAssistant(config)` - Check connection status for a single assistant

## Available Mutations

### Sessions

- `rpc.sessions.createSession` - Create a new session
- `rpc.sessions.deleteSession` - Delete a session
- `rpc.sessions.shareSession` - Share a session
- `rpc.sessions.unshareSession` - Unshare a session
- `rpc.sessions.abortSession` - Abort a running session
- `rpc.sessions.initializeSession` - Initialize a session
- `rpc.sessions.summarizeSession` - Summarize a session

### Messages

- `rpc.messages.sendMessage` - Send a message to a session

## Helper Functions

### Message Processing Helpers

- `rpc.messages.isMessageProcessing(message)` - Check if a message is still being processed
- `rpc.messages.getLatestAssistantMessage(messages)` - Get the latest assistant message
- `rpc.messages.isSessionProcessing(messages)` - Check if the session is currently processing
- `rpc.messages.formatMessageTime(timestamp)` - Format message timestamps

## Error Handling

All queries and mutations use the Result pattern with `ShErr` for errors. Use destructuring to access the data and error:

```typescript
const result = await mutation.execute(params);

// CORRECT: Use destructuring pattern
const { data, error } = result;
if (error) {
	// Handle error - error is of type ShError
	console.error(error.title, error.description);
} else if (data) {
	// Handle success - data is the typed response
	console.log('Success:', data);
}

// INCORRECT: Don't use .isErr() or .isOk()
// if (result.isErr()) { ... } // ❌ Don't do this
```

## Type Safety

All queries and mutations are fully typed. The TypeScript compiler will enforce correct parameter types and provide autocomplete for available options.

## Assistant Connection Checking

The assistant queries handle checking which OpenCode servers are online and available.

### How it Works

When you query assistants, the system:

1. Takes your saved assistant configurations
2. Attempts to connect to each OpenCode server in parallel
3. Merges the config with live app info if the connection succeeds
4. Returns enhanced assistant objects with connection status

### Assistant Type

```typescript
type Assistant = AssistantConfig & {
	checkedAt: number; // Unix timestamp of last connection check
} & (
		| { connected: true; appInfo: App } // Online assistant with full app info
		| { connected: false } // Offline/unreachable assistant
	);
```

### Usage Example

```typescript
// Check all assistants
const assistantsQuery = createQuery(rpc.assistants.getAssistants.options);

// In your component
{#each $assistantsQuery.data as assistant}
  {#if assistant.connected}
    <div>✅ {assistant.name} - Online</div>
    <div>Version: {assistant.appInfo.version}</div>
  {:else}
    <div>❌ {assistant.name} - Offline</div>
    <div>Last checked: {new Date(assistant.checkedAt).toLocaleTimeString()}</div>
  {/if}
{/each}
```

This pattern is used throughout the UI to show users which assistants are currently available for connection.

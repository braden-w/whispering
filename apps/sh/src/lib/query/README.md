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

Mutations are accessed directly and use the `.execute()` method:

```typescript
// Execute a mutation
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

### Workspaces

- `rpc.workspaces.getWorkspaces` - Fetch all workspace configs and check their connection status
- `rpc.workspaces.getWorkspace(config)` - Check connection status for a single workspace

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

## Workspace Connection Checking

The workspace queries handle checking which OpenCode servers are online and available.

### How it Works

When you query workspaces, the system:

1. Takes your saved workspace configurations
2. Attempts to connect to each OpenCode server in parallel
3. Merges the config with live app info if the connection succeeds
4. Returns enhanced workspace objects with connection status

### Workspace Type

```typescript
type Workspace = WorkspaceConfig & {
	checkedAt: number; // Unix timestamp of last connection check
} & (
		| { connected: true; appInfo: App } // Online workspace with full app info
		| { connected: false } // Offline/unreachable workspace
	);
```

### Usage Example

```typescript
// Check all workspaces
const workspacesQuery = createQuery(rpc.workspaces.getWorkspaces.options);

// In your component
{#each $workspacesQuery.data as workspace}
  {#if workspace.connected}
    <div>✅ {workspace.name} - Online</div>
    <div>Version: {workspace.appInfo.version}</div>
  {:else}
    <div>❌ {workspace.name} - Offline</div>
    <div>Last checked: {new Date(workspace.checkedAt).toLocaleTimeString()}</div>
  {/if}
{/each}
```

This pattern is used throughout the UI to show users which workspaces are currently available for connection.

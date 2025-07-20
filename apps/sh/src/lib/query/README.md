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
const sessionQuery = createQuery(rpc.sessions.getSessionById(sessionId).options);
const messagesQuery = createQuery(rpc.messages.getMessagesBySessionId(sessionId).options);
```

## Mutation Usage

Mutations are accessed directly and use the `.execute()` method:

```typescript
// Execute a mutation
const result = await rpc.sessions.createSession.execute({
  body: { title: 'New Session' }
});

// Handle the result
if (result.isErr()) {
  toast.error(result.error.title, {
    description: result.error.description
  });
} else {
  toast.success('Session created successfully');
  // Use result.value for the success data
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
  await queryClient.prefetchQuery(rpc.sessions.getSessionById(params.id).options());
  
  return {};
};
```

## Available Queries

### Sessions
- `rpc.sessions.getSessions` - Fetch all sessions
- `rpc.sessions.getSessionById(id)` - Fetch a specific session

### Messages
- `rpc.messages.getMessagesBySessionId(sessionId)` - Fetch messages for a session

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

All queries and mutations use the Result pattern with `ShErr` for errors:

```typescript
const result = await mutation.execute(params);

if (result.isErr()) {
  // Handle error
  console.error(result.error.title, result.error.description);
} else {
  // Handle success
  const data = result.value;
}
```

## Type Safety

All queries and mutations are fully typed. The TypeScript compiler will enforce correct parameter types and provide autocomplete for available options.
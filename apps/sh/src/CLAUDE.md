The auto-generated API client is located at:

```
src/lib/client/
```

For detailed usage, see the [client README](./lib/client/README.md).

Always use namespace imports for the API client:

```typescript
import * as api from '$lib/client';
```

## Query Layer Usage

The query layer wraps the API client with TanStack Query following wellcrafted patterns:

```typescript
import * as rpc from '$lib/query';
import { createQuery, createMutation } from '@tanstack/svelte-query';

// Queries in components - use .options
const sessionsQuery = createQuery(rpc.sessions.getSessions.options);
const sessionQuery = createQuery(rpc.sessions.getSessionById(id).options);

// In load functions - use .options()
await queryClient.prefetchQuery(rpc.sessions.getSessions.options());
await queryClient.prefetchQuery(rpc.sessions.getSessionById(id).options());

// Mutations in Svelte components - use createMutation
const createSessionMutation = createMutation(
	rpc.sessions.createSession.options,
);

// Use the mutation with callbacks in .mutate()
createSessionMutation.mutate(
	{ body: { title } },
	{
		onSuccess: (data) => {
			toast.success('Session created successfully');
			// Navigate to new session, etc.
		},
		onError: (error) => {
			toast.error(error.title, { description: error.description });
		},
	},
);

// Mutations in .ts files - use .execute() with destructuring
const result = await rpc.sessions.createSession.execute({ body: { title } });
const { data, error } = result;
if (error) {
	// Handle error - error is of type ShError
	toast.error(error.title, { description: error.description });
} else if (data) {
	// Handle success - data is the typed response
	toast.success('Session created successfully');
}
```

For detailed query documentation, see the [query README](./lib/query/README.md).

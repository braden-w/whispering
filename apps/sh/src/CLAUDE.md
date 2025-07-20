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
import { createQuery } from '@tanstack/svelte-query';

// In components - use .options
const sessionsQuery = createQuery(rpc.sessions.getSessions.options);
const sessionQuery = createQuery(rpc.sessions.getSessionById(id).options);

// In load functions - use .options()
await queryClient.prefetchQuery(rpc.sessions.getSessions.options());
await queryClient.prefetchQuery(rpc.sessions.getSessionById(id).options());

// Mutations - use .execute()
const result = await rpc.sessions.createSession.execute({ body: { title } });
if (result.isErr()) {
  // Handle error
} else {
  // Handle success
}
```

For detailed query documentation, see the [query README](./lib/query/README.md).

# OpenCode API Client

This directory contains the auto-generated TypeScript client for the OpenCode API, created using [@hey-api/openapi-ts](https://heyapi.dev/).

## Import Pattern

Always use namespace imports:

```typescript
import * as api from '$lib/client';
```

This pattern the functions are exported individually for better tree-shaking, and this improves code readability with the `api.` prefix.

## Generated Files

- **`client.gen.ts`** - HTTP client configuration
- **`sdk.gen.ts`** - Function exports for all API endpoints
- **`types.gen.ts`** - TypeScript types for requests/responses
- **`schemas.gen.ts`** - Zod schemas for runtime validation

## Basic Usage

```typescript
import * as api from '$lib/client';
import { client } from '$lib/client/client.gen';

// Get app info
const appInfo = await api.getApp();

// List all sessions
const sessions = await api.getSession();

// Create a new session
const newSession = await api.postSession({
	body: {
		provider: 'openai',
		model: 'gpt-4o-mini',
	},
});

// Send a message to a session
const message = await api.postSessionByIdMessage({
	path: { id: sessionId },
	body: {
		content: 'Hello!',
		stream: true,
	},
});
```

## Regenerating the Client

When the OpenCode API changes:

```bash
# Regenerate from running server
bun openapi-ts
```

This will:

1. Fetch the latest OpenAPI spec
2. Regenerate all client files
3. Update types automatically

## Important Notes

- **DO NOT** manually edit files in this directory
- All files are auto-generated and will be overwritten
- Make API changes in the OpenCode server, then regenerate
- The client is generated from http://localhost:4096/doc (see `openapi-ts.config.ts`)

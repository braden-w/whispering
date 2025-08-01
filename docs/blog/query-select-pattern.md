# Simplify with Select: Same Cache, Different View

I was building session management for my app and hit an interesting pattern with TanStack Query that I wish I'd discovered sooner.

Here's the situation: I had an API that returns all sessions, but sometimes I need just one specific session. My first instinct was to create two separate queries:

```typescript
// Query 1: Get all sessions
const getSessions = () => useQuery({
  queryKey: ['sessions'],
  queryFn: fetchAllSessions
});

// Query 2: Get one session
const getSessionById = (id) => useQuery({
  queryKey: ['sessions', id],
  queryFn: () => fetchSessionById(id)
});
```

Seems reasonable, right? Different needs, different queries. But here's what I realized: my API only has one endpoint that returns all sessions. There's no separate "get session by ID" endpoint.

So I was either:
1. Calling the same API twice with different query keys
2. Building a fake endpoint that just filters the data
3. Creating unnecessary cache fragmentation

## The Better Way

TanStack Query has this `select` option that transforms cached data. Instead of two queries, I now have:

```typescript
// Base query: fetches all sessions
export const getSessions = (workspace) =>
  defineQuery({
    queryKey: ['workspaces', workspace().id, 'sessions'],
    queryFn: async () => {
      const { data, error } = await api.getSession({ client });
      if (error) return ShErr({ title: 'Failed to fetch sessions' });
      return Ok(data);
    },
  });

// Derived query: selects one session from the cached data
export const getSessionById = (workspace, sessionId) =>
  defineQuery({
    queryKey: ['workspaces', workspace().id, 'sessions'], // Same key!
    queryFn: async () => {
      const { data, error } = await api.getSession({ client });
      if (error) return ShErr({ title: 'Failed to fetch sessions' });
      return Ok(data);
    },
    select: (data) => {
      const session = data?.find((s) => s.id === sessionId());
      if (!session) {
        return ShErr({ 
          title: 'Session not found',
          description: 'The requested session does not exist' 
        });
      }
      return Ok(session);
    },
  });
```

Notice they share the exact same query key and API call. The only difference is the `select` function.

## Why This Matters

This pattern clicked for me because:

1. **One source of truth**: Both queries share the same cache entry. When sessions update, both queries reflect the change instantly.

2. **No duplicate API calls**: If I've already fetched all sessions, getting a single session is just a cache lookup.

3. **Simpler cache invalidation**: I only need to invalidate one query key when sessions change.

4. **Consistency**: A single session is always consistent with the sessions list because they're literally the same data.

## When to Use This Pattern

This works great when:
- Your API returns collections but you need individual items
- You want to derive filtered or transformed views of cached data
- Multiple components need different "shapes" of the same underlying data

Here's another example I use for filtering:

```typescript
// Get only active sessions
export const getActiveSessions = (workspace) =>
  defineQuery({
    queryKey: ['workspaces', workspace().id, 'sessions'],
    queryFn: /* same as getSessions */,
    select: (data) => data?.filter(s => s.status === 'active') ?? []
  });
```

Same cache, different view.

## The Lesson

Before creating multiple queries for related data, ask: "Am I just transforming data I already have?" If yes, `select` is your friend.

It's one of those patterns that seems obvious in hindsight but took me way too long to discover. Hope it saves you some time!
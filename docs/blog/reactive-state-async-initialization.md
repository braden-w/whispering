# The Async State Initialization Dance

I hit this pattern again today while building a message store. You know the one: you need to initialize some reactive state, but the data comes from an async source.

Here's what I wanted to write:

```typescript
// messages.svelte.ts
export function createMessageStore() {
  // This would be perfect...
  const messages = $state(await fetchMessages());
  
  return {
    get messages() { return messages; }
  };
}
```

But you can't. State declarations are synchronous. The reactive system needs to set up all its tracking immediately, not whenever your promise resolves.

## The Pattern That Actually Works

So here's what I ended up with:

```typescript
// messages.svelte.ts
export function createMessageStore(sessionId: string) {
  let messages = $state<Message[]>([]);
  let loading = $state(true);

  async function loadInitialMessages() {
    try {
      const data = await fetchMessages(sessionId);
      messages = data;
    } finally {
      loading = false;
    }
  }

  return {
    get messages() { return messages; },
    get loading() { return loading; },
    loadInitialMessages
  };
}
```

Then in the component:

```svelte
<script>
  import { onMount } from 'svelte';
  import { createMessageStore } from '$lib/stores/messages.svelte.ts';
  
  const messageStore = createMessageStore(sessionId);
  
  onMount(() => {
    messageStore.loadInitialMessages();
  });
</script>

{#if messageStore.loading}
  <div>Loading messages...</div>
{:else}
  <!-- Use messageStore.messages -->
{/if}
```

## Why This Feels Wrong

Every time I write this pattern, something bothers me. I'm creating empty state, then immediately replacing it. The component has to know to call `loadInitialMessages()`. There's this awkward dance between declaration and initialization.

But here's the thing: this separation is actually useful. 

You get explicit control over when data loads. You can reload it. You can handle errors properly. You can show loading states. The component decides if it wants fresh data or cached data.

## The Server-Side Alternative

If you're using SvelteKit, you can sidestep this entirely with load functions:

```typescript
// +page.ts
export async function load() {
  const messages = await fetchMessages();
  return { messages };
}
```

But that only works for initial page loads. For client-side state that needs to refresh, update, or react to user actions, you're back to the store pattern above.

## What About Suspense?

React folks might reach for Suspense here. Svelte 5 doesn't have Suspense (yet?), but even if it did, you'd still need some way to trigger the initial load. The pattern would just move around, not disappear.

## The Lesson

Not every impedance mismatch needs fixing. Sometimes the "awkward" pattern is awkward because it's making something explicit that should be explicit.

Yes, I have to call `loadInitialMessages()` manually. But that means I know exactly when my data loads. I can reload it. I can skip loading if I already have cached data. I can handle errors in context.

The reactive system stays synchronous and predictable. The async complexity stays where I can see it and control it.

Sometimes the dance is the point.
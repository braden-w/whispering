<script lang="ts">
	import * as Chat from '@repo/ui/chat';
	import type { Message } from '$lib/stores/messages.svelte';
	import UserMessageBubble from './UserMessageBubble.svelte';
	import AssistantMessageBubble from './AssistantMessageBubble.svelte';

	let {
		messages,
	}: {
		messages: Message[];
	} = $props();
</script>

{#if messages.length === 0}
	<div class="flex-1 flex items-center justify-center text-muted-foreground">
		<div class="text-center">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-12 w-12 mx-auto mb-4 opacity-50"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
				/>
			</svg>
			<p class="text-sm">No messages yet. Start the conversation!</p>
		</div>
	</div>
{:else}
	<Chat.List class="flex-1">
		{#each messages as message (message.info.id)}
			{#if message.info.role === 'user'}
				<UserMessageBubble message={message.info} parts={message.parts} />
			{:else if message.info.role === 'assistant'}
				<AssistantMessageBubble message={message.info} parts={message.parts} />
			{/if}
		{/each}
	</Chat.List>
{/if}

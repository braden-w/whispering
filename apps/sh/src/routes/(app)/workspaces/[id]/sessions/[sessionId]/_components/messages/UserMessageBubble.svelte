<script lang="ts">
	import type { Part, UserMessage } from '$lib/client/types.gen';

	import { formatDate } from '$lib/utils/date';
	import * as Chat from '@repo/ui/chat';

	import MessagePartRenderer from './MessagePartRenderer.svelte';

	let { message, parts }: { message: UserMessage; parts: Part[] } = $props();

	function getUserInitials(): string {
		return 'U';
	}
</script>

<Chat.Bubble variant="sent">
	<Chat.BubbleAvatar>
		<Chat.BubbleAvatarImage src="" alt="User" />
		<Chat.BubbleAvatarFallback>
			{getUserInitials()}
		</Chat.BubbleAvatarFallback>
	</Chat.BubbleAvatar>
	<Chat.BubbleMessage class="flex flex-col gap-1 prose prose-invert">
		{#each parts as part}
			<MessagePartRenderer {part} />
		{/each}
		<div class="w-full text-xs opacity-70 text-end">
			{formatDate(new Date(message.time.created))}
		</div>
	</Chat.BubbleMessage>
</Chat.Bubble>

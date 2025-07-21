<script lang="ts">
	import type { UserMessage } from '$lib/client/types.gen';
	import * as Chat from '@repo/ui/chat';
	import * as Avatar from '@repo/ui/avatar';
	import { formatDate } from '$lib/utils/date';
	import MessagePartRenderer from './MessagePartRenderer.svelte';

	let { message }: { message: UserMessage } = $props();

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
	<Chat.BubbleMessage class="flex flex-col gap-1">
		<div class="prose prose-sm dark:prose-invert max-w-none">
			{#each message.parts as part}
				<MessagePartRenderer {part} />
			{/each}
		</div>
		<div class="w-full text-xs opacity-70 text-end">
			{formatDate(message.time.created)}
		</div>
	</Chat.BubbleMessage>
</Chat.Bubble>
<script lang="ts">
	import type { Message, UserMessage, AssistantMessage } from '$lib/client/types.gen';
	import * as Card from '@repo/ui/card';
	import { Badge } from '@repo/ui/badge';
	import { Skeleton } from '@repo/ui/skeleton';
	import { formatMessageTime } from '$lib/query';
	import { onMount } from 'svelte';

	let {
		messages,
		isLoading = false
	}: {
		messages: Message[];
		isLoading?: boolean;
	} = $props();

	let messagesContainer: HTMLDivElement | undefined = $state();

	// Auto-scroll to bottom when new messages arrive
	$effect(() => {
		if (messages.length && messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	});

	function isUserMessage(message: Message): message is UserMessage {
		return message.role === 'user';
	}

	function isAssistantMessage(message: Message): message is AssistantMessage {
		return message.role === 'assistant';
	}

	function getMessageText(message: Message): string {
		const textParts = message.parts.filter(part => part.type === 'text');
		return textParts.map(part => (part as any).text).join('\n');
	}

	function getToolUsage(message: AssistantMessage): number {
		return message.parts.filter(part => part.type === 'tool').length;
	}

	function isMessageProcessing(message: AssistantMessage): boolean {
		return !message.time.completed;
	}
</script>

<div
	class="flex-1 overflow-y-auto p-4 space-y-4"
	bind:this={messagesContainer}
>
	{#if isLoading}
		<div class="space-y-4">
			{#each Array(3) as _}
				<Skeleton class="h-20 w-full" />
			{/each}
		</div>
	{:else if messages.length === 0}
		<div class="flex items-center justify-center h-full text-muted-foreground">
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
		{#each messages as message}
			<div class="flex {isUserMessage(message) ? 'justify-end' : 'justify-start'}">
				<Card.Root class="max-w-[80%] {isUserMessage(message) ? 'bg-primary text-primary-foreground' : ''}">
					<Card.Header class="pb-2">
						<div class="flex items-center justify-between gap-4">
							<span class="text-sm font-medium">
								{isUserMessage(message) ? 'You' : 'Assistant'}
							</span>
							<div class="flex items-center gap-2">
								{#if isAssistantMessage(message)}
									{#if getToolUsage(message) > 0}
										<Badge variant="secondary" class="text-xs">
											{getToolUsage(message)} tool{getToolUsage(message) > 1 ? 's' : ''}
										</Badge>
									{/if}
									{#if isMessageProcessing(message)}
										<Badge variant="outline" class="text-xs">
											Processing...
										</Badge>
									{/if}
								{/if}
								<span class="text-xs opacity-70">
									{formatMessageTime(message.time.created)}
								</span>
							</div>
						</div>
					</Card.Header>
					<Card.Content>
						<div class="prose prose-sm dark:prose-invert max-w-none">
							{#if getMessageText(message)}
								<p class="whitespace-pre-wrap">{getMessageText(message)}</p>
							{/if}
							{#if isAssistantMessage(message) && message.error}
								<div class="mt-2 p-2 bg-destructive/10 text-destructive rounded">
									Error: {message.error.name}
								</div>
							{/if}
						</div>
						{#if isAssistantMessage(message) && message.cost > 0}
							<div class="mt-2 text-xs opacity-70">
								Cost: ${message.cost.toFixed(4)} • 
								Tokens: {message.tokens.input} in / {message.tokens.output} out
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			</div>
		{/each}
	{/if}
</div>
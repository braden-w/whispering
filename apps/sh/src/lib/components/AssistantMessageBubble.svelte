<script lang="ts">
	import type { AssistantMessage, Part } from '$lib/client/types.gen';
	import * as Chat from '@repo/ui/chat';
	import { Badge } from '@repo/ui/badge';
	import * as DropdownMenu from '@repo/ui/dropdown-menu';
	import { formatDate } from '$lib/utils/date';
	import MessagePartRenderer from './MessagePartRenderer.svelte';
	import { Copy, MoreHorizontal, RotateCcw, Edit } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { buttonVariants } from '@repo/ui/button';

	let { message, parts }: { message: AssistantMessage; parts: Part[] } = $props();

	const isProcessing = $derived(!message.time.completed);
	const toolParts = $derived(parts.filter(part => part.type === 'tool'));
	const hasError = $derived(!!message.error);

	function getAssistantInitials(): string {
		return 'AI';
	}

	function formatCost(cost: number): string {
		return cost > 0 ? `$${cost.toFixed(4)}` : '';
	}

	function formatTokens(tokens: AssistantMessage['tokens']): string {
		return `${tokens.input}→${tokens.output}`;
	}

	function getMessageText(): string {
		const textParts = parts.filter(part => part.type === 'text');
		return textParts.map(part => part.text).join('\n');
	}

	async function copyMessage() {
		const text = getMessageText();
		if (text) {
			try {
				await navigator.clipboard.writeText(text);
				toast.success('Message copied to clipboard');
			} catch (err) {
				toast.error('Failed to copy message');
			}
		}
	}

	function regenerateMessage() {
		// This would need to be implemented with proper message regeneration logic
		toast.info('Regenerate feature coming soon!');
	}

	function editMessage() {
		// This would need to be implemented with proper message editing logic
		toast.info('Edit feature coming soon!');
	}
</script>

<Chat.Bubble variant="received">
	<Chat.BubbleAvatar>
		<Chat.BubbleAvatarImage src="" alt="Assistant" />
		<Chat.BubbleAvatarFallback>
			{getAssistantInitials()}
		</Chat.BubbleAvatarFallback>
	</Chat.BubbleAvatar>
	<Chat.BubbleMessage class="flex flex-col gap-2" typing={isProcessing}>
		<!-- Message Header with Status -->
		<div class="flex items-center justify-between mb-1">
			<div class="flex items-center gap-2">
				<span class="text-sm font-medium">Assistant</span>
				{#if toolParts.length > 0}
					<Badge variant="secondary" class="text-xs">
						{toolParts.length} tool{toolParts.length > 1 ? 's' : ''}
					</Badge>
				{/if}
				{#if isProcessing}
					<Badge variant="outline" class="text-xs">
						Processing...
					</Badge>
				{/if}
				{#if hasError}
					<Badge variant="destructive" class="text-xs">
						Error
					</Badge>
				{/if}
			</div>
			
			<!-- Message Actions -->
			{#if !isProcessing}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class={buttonVariants({variant: 'ghost', size: 'icon'})}>
							<MoreHorizontal />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						<DropdownMenu.Item onclick={copyMessage}>
							<Copy class="h-4 w-4 mr-2" />
							Copy message
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={regenerateMessage}>
							<RotateCcw class="h-4 w-4 mr-2" />
							Regenerate
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={editMessage}>
							<Edit class="h-4 w-4 mr-2" />
							Edit
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{/if}
		</div>

		<!-- Message Content -->
		<div class="prose prose-sm dark:prose-invert max-w-none space-y-2 
			prose-pre:bg-slate-900 prose-pre:text-slate-50 
			dark:prose-pre:bg-slate-950 dark:prose-pre:text-slate-50
			prose-pre:overflow-x-auto prose-pre:max-w-full
			prose-code:text-xs prose-code:leading-relaxed">
			{#each parts as part}
				<MessagePartRenderer {part} />
			{/each}
		</div>

		<!-- Tool Execution Display -->
		{#if toolParts.length > 0}
			<div class="mt-2 space-y-2">
				{#each toolParts as toolPart}
					<!-- <ToolExecutionDisplay {toolPart} /> -->
					<MessagePartRenderer part={toolPart} />
				{/each}
			</div>
		{/if}

		<!-- Error Display -->
		{#if hasError && message.error}
			<div class="mt-2 p-3 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
				<div class="font-medium text-sm">{message.error.name}</div>
				{#if message.error.name === 'ProviderAuthError'}
					<div class="text-xs mt-1 opacity-90">
						Provider: {message.error.data.providerID}
					</div>
					<div class="text-xs opacity-90">
						{message.error.data.message}
					</div>
				{:else if message.error.name === 'UnknownError'}
					<div class="text-xs mt-1 opacity-90">
						{message.error.data.message}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Message Footer with Metadata -->
		<div class="flex items-center justify-between text-xs opacity-70 mt-1">
			<div class="flex items-center gap-2">
				<span>{formatDate(new Date(message.time.created))}</span>
				{#if message.time.completed}
					<span>•</span>
					<span>Completed {formatDate(new Date(message.time.completed))}</span>
				{/if}
			</div>
			<div class="flex items-center gap-2">
				{#if message.cost > 0}
					<span>{formatCost(message.cost)}</span>
					<span>•</span>
				{/if}
				<span>{formatTokens(message.tokens)}</span>
			</div>
		</div>
	</Chat.BubbleMessage>
</Chat.Bubble>
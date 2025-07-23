<script lang="ts">
	import type { ToolPart } from '$lib/client/types.gen';

	import { Badge } from '@repo/ui/badge';
	import { buttonVariants } from '@repo/ui/button';
	import * as Collapsible from '@repo/ui/collapsible';
	import { cn } from '@repo/ui/utils';
	import {
		CheckCircle,
		ChevronDown,
		ChevronRight,
		Clock,
		Loader2,
		XCircle,
	} from 'lucide-svelte';

	let { toolPart }: { toolPart: ToolPart } = $props();

	let isOpen = $state(false);

	const statusConfig = $derived.by(() => {
		switch (toolPart.state.status) {
			case 'completed':
				return {
					color: 'text-green-600 dark:text-green-400',
					icon: CheckCircle,
					label: 'Completed',
					variant: 'secondary' as const,
				};
			case 'error':
				return {
					color: 'text-red-600 dark:text-red-400',
					icon: XCircle,
					label: 'Error',
					variant: 'destructive' as const,
				};
			case 'pending':
				return {
					color: 'text-foreground/70',
					icon: Clock,
					label: 'Pending',
					variant: 'secondary' as const,
				};
			case 'running':
				return {
					animate: true,
					color: 'text-blue-600 dark:text-blue-400',
					icon: Loader2,
					label: 'Running',
					variant: 'secondary' as const,
				};
			default:
				return {
					color: 'text-foreground/70',
					icon: Clock,
					label: 'Unknown',
					variant: 'secondary' as const,
				};
		}
	});

	const StatusIcon = $derived(statusConfig.icon);

	const hasMetadata = $derived.by(() => {
		return (
			(toolPart.state.status === 'completed' || toolPart.state.status === 'running') &&
			'metadata' in toolPart.state &&
			toolPart.state.metadata &&
			Object.keys(toolPart.state.metadata).length > 0
		);
	});

	function formatDuration(start: number, end?: number): string {
		const duration = (end || Date.now()) - start;
		if (duration < 1000) return `${duration}ms`;
		return `${(duration / 1000).toFixed(1)}s`;
	}

	function formatInput(input: unknown): string {
		if (typeof input === 'string') return input;
		return JSON.stringify(input, null, 2);
	}
</script>

<div class="border rounded-lg p-3 bg-muted/20 border-border/50">
	<Collapsible.Root bind:open={isOpen}>
		<Collapsible.Trigger
			class={cn(
				buttonVariants({ variant: 'ghost' }),
				'w-full justify-between p-0 h-auto',
			)}
		>
			<div class="flex items-center gap-2">
				<StatusIcon
					class={cn(
						'h-4 w-4',
						statusConfig.color,
						statusConfig.animate && 'animate-spin'
					)}
				/>
				<span class="font-medium text-sm text-foreground">{toolPart.tool}</span>
				<Badge variant={statusConfig.variant} class="text-xs">
					{statusConfig.label}
				</Badge>
				{#if toolPart.state.status === 'running' && 'title' in toolPart.state && toolPart.state.title}
					<span class="text-xs text-foreground/60">
						{toolPart.state.title}
					</span>
				{/if}
			</div>
			<div class="flex items-center gap-2">
				{#if toolPart.state.status === 'completed'}
					<span class="text-xs text-foreground/60">
						{formatDuration(toolPart.state.time.start, toolPart.state.time.end)}
					</span>
				{:else if toolPart.state.status === 'running'}
					<span class="text-xs text-foreground/60">
						{formatDuration(toolPart.state.time.start)}
					</span>
				{/if}
				{#if isOpen}
					<ChevronDown class="h-4 w-4 text-foreground/60" />
				{:else}
					<ChevronRight class="h-4 w-4 text-foreground/60" />
				{/if}
			</div>
		</Collapsible.Trigger>

		<Collapsible.Content class="mt-3">
			<div class="space-y-3">
				<!-- Tool Input -->
				{#if toolPart.state.status !== 'pending' && 'input' in toolPart.state && toolPart.state.input}
					<div>
						<div class="text-xs font-medium text-foreground/70 mb-1">
							Input:
						</div>
						<pre
							class="text-xs bg-muted/50 text-foreground p-2 rounded overflow-x-auto border">{formatInput(
								toolPart.state.input,
							)}</pre>
					</div>
				{/if}

				<!-- Tool Output -->
				{#if toolPart.state.status === 'completed'}
					<div>
						<div class="text-xs font-medium text-foreground/70 mb-1">
							Output:
						</div>
						<pre
							class="text-xs bg-muted/50 text-foreground p-2 rounded overflow-x-auto whitespace-pre-wrap border">{toolPart
								.state.output}</pre>
					</div>
				{/if}

				<!-- Tool Error -->
				{#if toolPart.state.status === 'error'}
					<div>
						<div class="text-xs font-medium text-destructive mb-1">Error:</div>
						<pre
							class="text-xs bg-destructive/10 text-destructive p-2 rounded overflow-x-auto border border-destructive/20">{toolPart
								.state.error}</pre>
					</div>
				{/if}

				<!-- Metadata -->
				{#if hasMetadata}
					<div>
						<div class="text-xs font-medium text-foreground/70 mb-1">
							Metadata:
						</div>
						<pre
							class="text-xs bg-muted/50 text-foreground p-2 rounded overflow-x-auto border">{JSON.stringify(
								(toolPart.state.status === 'completed' || toolPart.state.status === 'running') && 'metadata' in toolPart.state
									? toolPart.state.metadata
									: {},
								null,
								2,
							)}</pre>
					</div>
				{/if}
			</div>
		</Collapsible.Content>
	</Collapsible.Root>
</div>

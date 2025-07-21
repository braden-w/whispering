<script lang="ts">
	import type { ToolPart } from '$lib/client/types.gen';
	import { Badge } from '@repo/ui/badge';
	import { Button } from '@repo/ui/button';
	import * as Collapsible from '@repo/ui/collapsible';
	import { ChevronDown, ChevronRight, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-svelte';

	let { toolPart }: { toolPart: ToolPart } = $props();

	let isOpen = $state(false);

	const statusConfig = $derived(() => {
		switch (toolPart.state.status) {
			case 'pending':
				return {
					icon: Clock,
					variant: 'outline' as const,
					label: 'Pending',
					color: 'text-muted-foreground'
				};
			case 'running':
				return {
					icon: Loader2,
					variant: 'outline' as const,
					label: 'Running',
					color: 'text-blue-500',
					animate: true
				};
			case 'completed':
				return {
					icon: CheckCircle,
					variant: 'secondary' as const,
					label: 'Completed',
					color: 'text-green-500'
				};
			case 'error':
				return {
					icon: XCircle,
					variant: 'destructive' as const,
					label: 'Error',
					color: 'text-red-500'
				};
			default:
				return {
					icon: Clock,
					variant: 'outline' as const,
					label: 'Unknown',
					color: 'text-muted-foreground'
				};
		}
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

<div class="border rounded-lg p-3 bg-muted/30">
	<Collapsible.Root bind:open={isOpen}>
		<Collapsible.Trigger asChild let:builder>
			<Button builders={[builder]} variant="ghost" class="w-full justify-between p-0 h-auto">
				<div class="flex items-center gap-2">
					<svelte:component 
						this={statusConfig.icon} 
						class="h-4 w-4 {statusConfig.color} {statusConfig.animate ? 'animate-spin' : ''}" 
					/>
					<span class="font-medium text-sm">{toolPart.tool}</span>
					<Badge variant={statusConfig.variant} class="text-xs">
						{statusConfig.label}
					</Badge>
					{#if toolPart.state.status === 'running' && toolPart.state.title}
						<span class="text-xs text-muted-foreground">
							{toolPart.state.title}
						</span>
					{/if}
				</div>
				<div class="flex items-center gap-2">
					{#if toolPart.state.status === 'completed'}
						<span class="text-xs text-muted-foreground">
							{formatDuration(toolPart.state.time.start, toolPart.state.time.end)}
						</span>
					{:else if toolPart.state.status === 'running'}
						<span class="text-xs text-muted-foreground">
							{formatDuration(toolPart.state.time.start)}
						</span>
					{/if}
					{#if isOpen}
						<ChevronDown class="h-4 w-4" />
					{:else}
						<ChevronRight class="h-4 w-4" />
					{/if}
				</div>
			</Button>
		</Collapsible.Trigger>
		
		<Collapsible.Content class="mt-3">
			<div class="space-y-3">
				<!-- Tool Input -->
				{#if toolPart.state.status !== 'pending' && toolPart.state.input}
					<div>
						<div class="text-xs font-medium text-muted-foreground mb-1">Input:</div>
						<pre class="text-xs bg-muted p-2 rounded overflow-x-auto">{formatInput(toolPart.state.input)}</pre>
					</div>
				{/if}

				<!-- Tool Output -->
				{#if toolPart.state.status === 'completed'}
					<div>
						<div class="text-xs font-medium text-muted-foreground mb-1">Output:</div>
						<pre class="text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">{toolPart.state.output}</pre>
					</div>
				{/if}

				<!-- Tool Error -->
				{#if toolPart.state.status === 'error'}
					<div>
						<div class="text-xs font-medium text-destructive mb-1">Error:</div>
						<pre class="text-xs bg-destructive/10 text-destructive p-2 rounded overflow-x-auto">{toolPart.state.error}</pre>
					</div>
				{/if}

				<!-- Metadata -->
				{#if toolPart.state.status !== 'pending' && toolPart.state.metadata && Object.keys(toolPart.state.metadata).length > 0}
					<div>
						<div class="text-xs font-medium text-muted-foreground mb-1">Metadata:</div>
						<pre class="text-xs bg-muted p-2 rounded overflow-x-auto">{JSON.stringify(toolPart.state.metadata, null, 2)}</pre>
					</div>
				{/if}
			</div>
		</Collapsible.Content>
	</Collapsible.Root>
</div>
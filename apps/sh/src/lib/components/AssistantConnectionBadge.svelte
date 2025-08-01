<script lang="ts">
	import * as rpc from '$lib/query';
	import type { AssistantConfig } from '$lib/types/assistant-config';
	import { Badge } from '@repo/ui/badge';
	import { createQuery } from '@tanstack/svelte-query';
	import { CheckCircle2, Loader2, XCircle } from 'lucide-svelte';

	let {
		assistantConfig,
		refetchInterval = 2000,
	}: { assistantConfig: AssistantConfig; refetchInterval?: number } = $props();

	const assistantQuery = createQuery(() => ({
		...rpc.assistants.getAssistant(() => assistantConfig).options(),
		refetchInterval,
	}));

	// True only before we've received ANY response (success or failure)
	const isAwaitingFirstResponse = $derived(
		assistantQuery.dataUpdatedAt === 0 && assistantQuery.errorUpdatedAt === 0,
	);
</script>

{#if isAwaitingFirstResponse && assistantQuery.isPending}
	<Badge variant="secondary">
		<Loader2 class="mr-1 h-3 w-3 animate-spin" />
		Checking
	</Badge>
{:else if assistantQuery.data?.connected}
	<Badge variant="success">
		<CheckCircle2 class="mr-1 h-3 w-3" />
		Connected
	</Badge>
{:else}
	<Badge variant="destructive">
		<XCircle class="mr-1 h-3 w-3" />
		Disconnected
	</Badge>
{/if}

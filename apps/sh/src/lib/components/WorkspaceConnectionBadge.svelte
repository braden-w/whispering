<script lang="ts">
	import type { WorkspaceConfig } from '$lib/stores/workspace-configs.svelte';

	import * as rpc from '$lib/query';
	import { Badge } from '@repo/ui/badge';
	import { createQuery } from '@tanstack/svelte-query';
	import { CheckCircle2, Loader2, XCircle } from 'lucide-svelte';

	let {
		refetchInterval = 2000,
		workspaceConfig,
	}: { refetchInterval?: number; workspaceConfig: WorkspaceConfig; } = $props();

	const workspaceQuery = createQuery(() => ({
		...rpc.workspaces.getWorkspace(() => workspaceConfig).options(),
		refetchInterval,
	}));
</script>

{#if workspaceQuery.isPending}
	<Badge variant="secondary">
		<Loader2 class="mr-1 h-3 w-3 animate-spin" />
		Checking
	</Badge>
{:else if workspaceQuery.data?.connected}
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

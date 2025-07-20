<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import * as rpc from '$lib/query';
	import { Badge } from '@repo/ui/badge';
	import { CheckCircle2, XCircle, Loader2 } from 'lucide-svelte';
	import type { WorkspaceConfig } from '$lib/stores/workspaces.svelte';

	let { workspace, refetchInterval = 2000 }: { workspace: WorkspaceConfig; refetchInterval?: number } = $props();

	const workspaceQuery = createQuery(
		() => ({
			...rpc.workspaces.getWorkspace(() => workspace).options(),
			refetchInterval,
		})
	);
</script>

{#if workspaceQuery.isPending}
	<Badge variant="secondary">
		<Loader2 class="mr-1 h-3 w-3 animate-spin" />
		Checking
	</Badge>
{:else if workspaceQuery.data?.connected}
	<Badge variant="default">
		<CheckCircle2 class="mr-1 h-3 w-3" />
		Connected
	</Badge>
{:else}
	<Badge variant="destructive">
		<XCircle class="mr-1 h-3 w-3" />
		Disconnected
	</Badge>
{/if}
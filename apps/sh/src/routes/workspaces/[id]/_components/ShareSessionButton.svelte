<script lang="ts">
	import type { Session } from '$lib/client/types.gen';
	import type { WorkspaceConfig } from '$lib/stores/workspace-configs.svelte';
	import { Button } from '@repo/ui/button';
	import { toast } from 'svelte-sonner';
	import * as rpc from '$lib/query';
	import { createMutation } from '@tanstack/svelte-query';
	import { Share, Link } from 'lucide-svelte';

	let { session, workspaceConfig }: { 
		session: Session; 
		workspaceConfig: WorkspaceConfig;
	} = $props();

	const isShared = $derived(!!session.share?.url);

	const shareSessionMutation = createMutation(rpc.sessions.shareSession.options);
	const unshareSessionMutation = createMutation(rpc.sessions.unshareSession.options);

	function handleShare() {
		shareSessionMutation.mutate(
			{ workspaceConfig, sessionId: session.id },
			{
				onSuccess: () => {
					toast.success('Session shared successfully');
				},
				onError: (error) => {
					toast.error(error.title, {
						description: error.description,
					});
				},
			},
		);
	}

	function handleUnshare() {
		unshareSessionMutation.mutate(
			{ workspaceConfig, sessionId: session.id },
			{
				onSuccess: () => {
					toast.success('Session unshared successfully');
				},
				onError: (error) => {
					toast.error(error.title, {
						description: error.description,
					});
				},
			},
		);
	}
</script>

{#if isShared}
	<Button
		size="sm"
		variant="outline"
		onclick={handleUnshare}
		disabled={unshareSessionMutation.isPending}
	>
		{#if unshareSessionMutation.isPending}
			Unsharing...
		{:else}
			Unshare
		{/if}
	</Button>
{:else}
	<Button
		size="sm"
		variant="outline"
		onclick={handleShare}
		disabled={shareSessionMutation.isPending}
	>
		{#if shareSessionMutation.isPending}
			Sharing...
		{:else}
			Share
		{/if}
	</Button>
{/if}
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

</script>

{#if isShared}
	<Button
		size="icon"
		variant="ghost"
		onclick={() => unshareSessionMutation.mutate(
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
		)}
		disabled={unshareSessionMutation.isPending}
		title="Unshare session"
	>
		<Link class="h-4 w-4" />
	</Button>
{:else}
	<Button
		size="icon"
		variant="ghost"
		onclick={() => shareSessionMutation.mutate(
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
		)}
		disabled={shareSessionMutation.isPending}
		title="Share session"
	>
		<Share class="h-4 w-4" />
	</Button>
{/if}
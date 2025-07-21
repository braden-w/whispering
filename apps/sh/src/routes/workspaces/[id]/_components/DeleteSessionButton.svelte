<script lang="ts">
	import type { Session } from '$lib/client/types.gen';
	import type { WorkspaceConfig } from '$lib/stores/workspace-configs.svelte';
	import { Button } from '@repo/ui/button';
	import { toast } from 'svelte-sonner';
	import * as rpc from '$lib/query';
	import * as AlertDialog from '@repo/ui/alert-dialog';
	import { createMutation } from '@tanstack/svelte-query';
	import { Trash2 } from 'lucide-svelte';

	let { session, workspaceConfig }: { 
		session: Session; 
		workspaceConfig: WorkspaceConfig;
	} = $props();

	let open = $state(false);

	const deleteSessionMutation = createMutation(rpc.sessions.deleteSession.options);

	function handleDelete() {
		deleteSessionMutation.mutate(
			{ workspaceConfig, sessionId: session.id },
			{
				onSuccess: () => {
					toast.success('Session deleted successfully');
					open = false;
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

<AlertDialog.Root bind:open>
	<AlertDialog.Trigger>
		<Button size="icon" variant="ghost" title="Delete session">
			<Trash2 class="h-4 w-4" />
		</Button>
	</AlertDialog.Trigger>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This action cannot be undone. This will permanently delete the
				session "{session.title || 'Untitled Session'}" and all its
				messages.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={handleDelete}
				disabled={deleteSessionMutation.isPending}
			>
				{#if deleteSessionMutation.isPending}
					Deleting...
				{:else}
					Delete
				{/if}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
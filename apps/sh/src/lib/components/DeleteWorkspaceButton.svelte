<script lang="ts">
	import { Button } from '@repo/ui/button';
	import * as AlertDialog from '@repo/ui/alert-dialog';
	import { Trash2 } from 'lucide-svelte';
	import { workspaces } from '$lib/stores/workspaces.svelte';
	import { toast } from 'svelte-sonner';
	import type { Workspace } from '$lib/query/workspaces';

	let { workspace }: { workspace: Workspace } = $props();
	let open = $state(false);

	function handleDelete() {
		workspaces.value = workspaces.value.filter((w) => w.id !== workspace.id);
		open = false;
		toast.success('Deleted workspace');
	}
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Trigger>
		{#snippet child({ props })}
			<Button size="icon" variant="ghost" {...props}>
				<Trash2 class="h-4 w-4" />
			</Button>
		{/snippet}
	</AlertDialog.Trigger>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This will permanently delete the workspace "{workspace.name}".
				This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={handleDelete}>Delete</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
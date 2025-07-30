<script lang="ts">
	import { goto } from '$app/navigation';
	import * as rpc from '$lib/query';
	import type { AssistantConfig } from '$lib/types/assistant-config';
	import * as AlertDialog from '@repo/ui/alert-dialog';
	import { Button } from '@repo/ui/button';
	import { createMutation } from '@tanstack/svelte-query';
	import { Loader2, Trash2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let { assistantConfig }: { assistantConfig: AssistantConfig } = $props();
	let open = $state(false);

	// Delete mutation
	const deleteMutation = createMutation(
		rpc.assistantConfigs.deleteAssistantConfig.options
	);

	function handleDelete() {
		deleteMutation.mutate(
			{ id: assistantConfig.id },
			{
				onSuccess: () => {
					toast.success('Deleted assistant');
					open = false;
					// Navigate back to assistants list if we're on the assistant page
					if (window.location.pathname.includes(`/assistants/${assistantConfig.id}`)) {
						goto('/assistants');
					}
				},
				onError: (error) => {
					toast.error(error.title, { description: error.description });
				},
			}
		);
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
				This will permanently delete the assistant "{assistantConfig.name}".
				This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={handleDelete} disabled={deleteMutation.isPending}>
				{#if deleteMutation.isPending}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Deleting...
				{:else}
					Delete
				{/if}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

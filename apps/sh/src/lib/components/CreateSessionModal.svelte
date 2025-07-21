<script lang="ts">
	import * as Modal from '@repo/ui/modal';
	import { Button } from '@repo/ui/button';
	import { Input } from '@repo/ui/input';
	import { Label } from '@repo/ui/label';
	import * as rpc from '$lib/query';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import type { Workspace } from '$lib/stores/workspaces.svelte';

	let {
		open = $bindable(false),
		workspace,
	}: {
		open?: boolean;
		workspace: Workspace;
	} = $props();

	let title = $state('');
	let isCreating = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!workspace) {
			toast.error('No workspace selected');
			return;
		}

		isCreating = true;
		const result = await rpc.sessions.createSession.execute({ workspace });

		const { data, error } = result;
		if (error) {
			toast.error(error.title, {
				description: error.description,
			});
			console.error('Error creating session:', error);
		} else if (data?.id) {
			toast.success('Session created successfully');
			goto(`/workspaces/${workspace.id}/sessions/${data.id}`);
			open = false;
			title = '';
		}

		isCreating = false;
	}

	function handleOpenChange(value: boolean) {
		open = value;
		if (!value) {
			title = '';
		}
	}
</script>

<Modal.Root bind:open onOpenChange={handleOpenChange}>
	<Modal.Content class="sm:max-w-[425px]">
		<Modal.Header>
			<Modal.Title>Create New Session</Modal.Title>
			<Modal.Description>
				Start a new conversation session. You can optionally provide a title.
			</Modal.Description>
		</Modal.Header>
		<form onsubmit={handleSubmit}>
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="title">Session Title (optional)</Label>
					<Input
						id="title"
						bind:value={title}
						placeholder="e.g., Debugging authentication issue"
						disabled={isCreating}
					/>
				</div>
			</div>
			<Modal.Footer>
				<Button
					type="button"
					variant="outline"
					onclick={() => (open = false)}
					disabled={isCreating}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isCreating}>
					{#if isCreating}
						Creating...
					{:else}
						Create Session
					{/if}
				</Button>
			</Modal.Footer>
		</form>
	</Modal.Content>
</Modal.Root>

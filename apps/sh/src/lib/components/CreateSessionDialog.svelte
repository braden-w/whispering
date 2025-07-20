<script lang="ts">
	import * as Dialog from '@repo/ui/dialog';
	import { Button } from '@repo/ui/button';
	import { Input } from '@repo/ui/input';
	import { Label } from '@repo/ui/label';
	import * as rpc from '$lib/query';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import type { Workspace } from '$lib/stores/workspaces.svelte';

	let {
		open = $bindable(false),
		workspace
	}: {
		open?: boolean;
		workspace: Workspace;
	} = $props();

	let title = $state('');
	const createSession = rpc.sessions.createSession;
	let isCreating = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!workspace) {
			toast.error('No workspace selected');
			return;
		}

		isCreating = true;
		const result = await createSession.execute({ workspace });

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

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Create New Session</Dialog.Title>
			<Dialog.Description>
				Start a new conversation session. You can optionally provide a title.
			</Dialog.Description>
		</Dialog.Header>
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
			<Dialog.Footer>
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
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

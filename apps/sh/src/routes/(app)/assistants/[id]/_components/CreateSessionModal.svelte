<script lang="ts">
	import type { AssistantConfig } from '$lib/types/assistant-config';

	import { goto } from '$app/navigation';
	import * as rpc from '$lib/query';
	import { Button } from '@repo/ui/button';
	import { Input } from '@repo/ui/input';
	import { Label } from '@repo/ui/label';
	import * as Modal from '@repo/ui/modal';
	import { createMutation } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';

	let {
		assistantConfig,
		open = $bindable(false),
	}: {
		assistantConfig: AssistantConfig;
		open?: boolean;
	} = $props();

	let title = $state('');

	const createSessionMutation = createMutation(
		rpc.sessions.createSession.options,
	);
</script>

<Modal.Root
	bind:open
	onOpenChange={(value) => {
		open = value;
		if (!value) {
			title = '';
		}
	}}
>
	<Modal.Content class="sm:max-w-[425px]">
		<Modal.Header>
			<Modal.Title>Create New Session</Modal.Title>
			<Modal.Description>
				Start a new conversation session. You can optionally provide a title.
			</Modal.Description>
		</Modal.Header>
		<form
			onsubmit={(e) => {
				e.preventDefault();

				if (!assistantConfig) {
					toast.error('No assistant selected');
					return;
				}

				createSessionMutation.mutate(
					{ assistantConfig },
					{
						onError: (error) => {
							toast.error(error.title, {
								description: error.description,
							});
							console.error('Error creating session:', error);
						},
						onSuccess: (data) => {
							toast.success('Session created successfully');
							if (data?.id) {
								goto(`/assistants/${assistantConfig.id}/sessions/${data.id}`);
								open = false;
								title = '';
							}
						},
					},
				);
			}}
		>
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="title">Session Title (optional)</Label>
					<Input
						id="title"
						bind:value={title}
						placeholder="e.g., Debugging authentication issue"
						disabled={createSessionMutation.isPending}
					/>
				</div>
			</div>
			<Modal.Footer>
				<Button
					type="button"
					variant="outline"
					onclick={() => (open = false)}
					disabled={createSessionMutation.isPending}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={createSessionMutation.isPending}>
					{#if createSessionMutation.isPending}
						Creating...
					{:else}
						Create Session
					{/if}
				</Button>
			</Modal.Footer>
		</form>
	</Modal.Content>
</Modal.Root>

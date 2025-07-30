<script lang="ts">
	import * as rpc from '$lib/query';
	import type { AssistantConfig } from '$lib/types/assistant-config';
	import { Button } from '@repo/ui/button';
	import { buttonVariants } from '@repo/ui/button';
	import { Input } from '@repo/ui/input';
	import { Label } from '@repo/ui/label';
	import * as Modal from '@repo/ui/modal';
	import { createMutation } from '@tanstack/svelte-query';
	import { Edit, Loader2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let { assistantConfig }: { assistantConfig: AssistantConfig } = $props();

	let open = $state(false);

	// Form state - initialize with assistant values
	let name = $state(assistantConfig.name);
	let url = $state(assistantConfig.url);
	let password = $state(assistantConfig.password);

	// Reset form when modal opens
	$effect(() => {
		if (open) {
			name = assistantConfig.name;
			url = assistantConfig.url;
			password = assistantConfig.password;
		}
	});

	// Update mutation
	const updateMutation = createMutation(
		rpc.assistantConfigs.updateAssistantConfig.options
	);

	function handleSave() {
		if (!name.trim()) {
			toast.error('Please enter a name');
			return;
		}

		updateMutation.mutate(
			{
				id: assistantConfig.id,
				name: name.trim(),
				password,
				url,
			},
			{
				onSuccess: () => {
					toast.success('Assistant updated successfully');
					open = false;
				},
				onError: (error) => {
					toast.error(error.title, { description: error.description });
				},
			}
		);
	}
</script>

<Modal.Root bind:open>
	<Modal.Trigger class={buttonVariants({ size: 'icon', variant: 'ghost' })}>
		<Edit class="h-4 w-4" />
	</Modal.Trigger>
	<Modal.Content class="sm:max-w-[500px]">
		<Modal.Header>
			<Modal.Title>Edit Assistant</Modal.Title>
			<Modal.Description>Update the assistant configuration</Modal.Description>
		</Modal.Header>

		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="edit-name">Assistant Name</Label>
				<Input id="edit-name" bind:value={name} placeholder="My Project" />
			</div>

			<div class="space-y-2">
				<Label for="edit-url">Server URL</Label>
				<Input
					id="edit-url"
					bind:value={url}
					placeholder="https://your-tunnel-url.example.com"
				/>
			</div>

			<div class="space-y-2">
				<Label for="edit-password">Password</Label>
				<Input
					id="edit-password"
					type="password"
					bind:value={password}
					placeholder="Password for basic auth"
					autocomplete="new-password"
				/>
			</div>
		</div>

		<Modal.Footer>
			<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button onclick={handleSave} disabled={updateMutation.isPending}>
				{#if updateMutation.isPending}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Saving...
				{:else}
					Save Changes
				{/if}
			</Button>
		</Modal.Footer>
	</Modal.Content>
</Modal.Root>

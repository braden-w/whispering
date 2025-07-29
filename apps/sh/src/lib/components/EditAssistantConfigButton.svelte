<script lang="ts">
	import {
		type AssistantConfig,
		assistantConfigs,
		UpdateAssistantParams,
	} from '$lib/stores/assistant-configs.svelte';
	import { Button } from '@repo/ui/button';
	import { buttonVariants } from '@repo/ui/button';
	import { Input } from '@repo/ui/input';
	import { Label } from '@repo/ui/label';
	import * as Modal from '@repo/ui/modal';
	import { type } from 'arktype';
	import { Edit } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let { assistantConfig }: { assistantConfig: AssistantConfig } = $props();

	let open = $state(false);

	// Form state - initialize with assistant values
	let name = $derived(assistantConfig.name);
	let url = $derived(assistantConfig.url);
	let password = $derived(assistantConfig.password);

	function handleSave() {
		const validationResult = UpdateAssistantParams({
			name: name.trim(),
			password,
			url,
		} satisfies UpdateAssistantParams);

		if (validationResult instanceof type.errors) {
			toast.error('Validation failed', {
				description: validationResult.summary,
			});
			return;
		}

		assistantConfigs.update(assistantConfig.id, validationResult);
		open = false;
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
			<Button onclick={handleSave}>Save Changes</Button>
		</Modal.Footer>
	</Modal.Content>
</Modal.Root>

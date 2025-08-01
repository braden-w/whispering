<script lang="ts">
	import { settings } from '$lib/stores/settings.svelte';
	import { Button } from '@repo/ui/button';
	import { Input } from '@repo/ui/input';
	import { Label } from '@repo/ui/label';
	import * as Modal from '@repo/ui/modal';
	import { toast } from 'svelte-sonner';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	// Local state for form
	let username = $state(settings.value.defaultUsername);
	let password = $state(settings.value.defaultPassword);

	// Reset form when modal opens
	$effect(() => {
		if (open) {
			username = settings.value.defaultUsername;
			password = settings.value.defaultPassword;
		}
	});

	function handleSave() {
		if (!username) {
			toast.error('Username cannot be empty');
			return;
		}

		settings.value = {
			defaultPassword: password,
			defaultUsername: username,
		};

		toast.success('Settings saved successfully');
		open = false;
	}

	function handleCancel() {
		// Reset to current settings
		username = settings.value.defaultUsername;
		password = settings.value.defaultPassword;
		open = false;
	}
</script>

<Modal.Root bind:open>
	<Modal.Content class="sm:max-w-[425px]">
		<Modal.Header>
			<Modal.Title>Settings</Modal.Title>
			<Modal.Description>
				Configure default credentials for new assistant connections
			</Modal.Description>
		</Modal.Header>

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="default-username">Default Username</Label>
				<Input
					id="default-username"
					bind:value={username}
					placeholder="Enter default username"
					autocomplete="off"
				/>
			</div>
			<div class="space-y-2">
				<Label for="default-password">Default Password</Label>
				<Input
					id="default-password"
					type="password"
					bind:value={password}
					placeholder="Enter default password"
					autocomplete="new-password"
				/>
			</div>
			<p class="text-sm text-muted-foreground">
				These credentials will be used as defaults when creating new assistants.
				You can always override them for individual assistants.
			</p>
		</div>

		<Modal.Footer>
			<Button variant="outline" onclick={handleCancel}>Cancel</Button>
			<Button onclick={handleSave}>Save Changes</Button>
		</Modal.Footer>
	</Modal.Content>
</Modal.Root>

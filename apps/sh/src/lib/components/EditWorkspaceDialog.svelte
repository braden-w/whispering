<script lang="ts">
	import * as Dialog from '@repo/ui/dialog';
	import { Button } from '@repo/ui/button';
	import { Input } from '@repo/ui/input';
	import { Label } from '@repo/ui/label';
	import {
		updateWorkspace,
		type WorkspaceConfig,
	} from '$lib/stores/workspaces.svelte';
	import { toast } from 'svelte-sonner';

	let {
		workspace,
		open = $bindable(false),
		onOpenChange,
	}: {
		workspace: WorkspaceConfig;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	} = $props();

	// Form state - initialize with workspace values
	let name = $state(workspace.name);
	let url = $state(workspace.url);
	let port = $state(workspace.port);
	let username = $state(workspace.username);
	let password = $state(workspace.password);

	// Reset form when workspace changes
	$effect(() => {
		name = workspace.name;
		url = workspace.url;
		port = workspace.port;
		username = workspace.username;
		password = workspace.password;
	});

	function handleSave() {
		if (!name.trim()) {
			toast.error('Workspace name is required');
			return;
		}

		if (!url.trim()) {
			toast.error('URL is required');
			return;
		}

		if (!username.trim() || !password.trim()) {
			toast.error('Username and password are required');
			return;
		}

		if (port < 1024 || port > 65535) {
			toast.error('Port must be between 1024 and 65535');
			return;
		}

		updateWorkspace(workspace.id, {
			name: name.trim(),
			url: url.trim(),
			port,
			username,
			password,
		});

		toast.success('Workspace updated successfully');

		if (onOpenChange) {
			onOpenChange(false);
		} else {
			open = false;
		}
	}

	function handleOpenChange(newOpen: boolean) {
		if (onOpenChange) {
			onOpenChange(newOpen);
		} else {
			open = newOpen;
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title>Edit Workspace</Dialog.Title>
			<Dialog.Description>
				Update the workspace configuration
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="edit-name">Workspace Name</Label>
				<Input id="edit-name" bind:value={name} placeholder="My Project" />
			</div>

			<div class="space-y-2">
				<Label for="edit-url">ngrok URL</Label>
				<Input
					id="edit-url"
					bind:value={url}
					placeholder="https://abc123.ngrok.io"
				/>
			</div>

			<div class="space-y-2">
				<Label for="edit-port">Port</Label>
				<Input
					id="edit-port"
					type="number"
					bind:value={port}
					min="1024"
					max="65535"
				/>
			</div>

			<div class="space-y-2">
				<Label for="edit-username">Username</Label>
				<Input
					id="edit-username"
					bind:value={username}
					placeholder="Username for basic auth"
					autocomplete="off"
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

		<Dialog.Footer>
			<Dialog.Close>
				<Button variant="outline">Cancel</Button>
			</Dialog.Close>
			<Button onclick={handleSave}>Save Changes</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

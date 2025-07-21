<script lang="ts">
	import * as Modal from '@repo/ui/modal';
	import { Button } from '@repo/ui/button';
	import { Input } from '@repo/ui/input';
	import { Label } from '@repo/ui/label';
	import {
		updateWorkspaceConfig,
		type WorkspaceConfig,
	} from '$lib/stores/workspace-configs.svelte';
	import { toast } from 'svelte-sonner';
	import { Edit } from 'lucide-svelte';
	import { buttonVariants } from '@repo/ui/button';

	let { workspaceConfig }: { workspaceConfig: WorkspaceConfig } = $props();

	let open = $state(false);

	// Form state - initialize with workspace values
	let url = $derived(workspaceConfig.url);
	let privatePort = $derived(workspaceConfig.privatePort);
	let publicPort = $derived(workspaceConfig.publicPort);
	let username = $derived(workspaceConfig.username);
	let password = $derived(workspaceConfig.password);

	function handleSave() {
		if (!url.trim()) {
			toast.error('URL is required');
			return;
		}

		if (!username.trim() || !password.trim()) {
			toast.error('Username and password are required');
			return;
		}

		if (privatePort < 1024 || privatePort > 65535 || publicPort < 1024 || publicPort > 65535) {
			toast.error('Ports must be between 1024 and 65535');
			return;
		}

		if (privatePort === publicPort) {
			toast.error('Private and public ports must be different');
			return;
		}

		updateWorkspaceConfig(workspaceConfig.id, {
			name: workspaceConfig.name,
			url: url.trim(),
			privatePort,
			publicPort,
			username,
			password,
		});

		toast.success('Workspace updated successfully');
		open = false;
	}
</script>

<Modal.Root bind:open>
	<Modal.Trigger class={buttonVariants({ size: 'icon', variant: 'ghost' })}>
		<Edit class="h-4 w-4" />
	</Modal.Trigger>
	<Modal.Content class="sm:max-w-[500px]">
		<Modal.Header>
			<Modal.Title>Edit Workspace</Modal.Title>
			<Modal.Description>
				Update the workspace configuration
			</Modal.Description>
		</Modal.Header>

		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="edit-url">ngrok URL</Label>
				<Input
					id="edit-url"
					bind:value={url}
					placeholder="https://abc123.ngrok.io"
				/>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="edit-private-port">Private Port (OpenCode)</Label>
					<Input
						id="edit-private-port"
						type="number"
						bind:value={privatePort}
						min="1024"
						max="65535"
					/>
				</div>
				<div class="space-y-2">
					<Label for="edit-public-port">Public Port (Caddy)</Label>
					<Input
						id="edit-public-port"
						type="number"
						bind:value={publicPort}
						min="1024"
						max="65535"
					/>
				</div>
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

		<Modal.Footer>
			<Button variant="outline" onclick={() => open = false}>Cancel</Button>
			<Button onclick={handleSave}>Save Changes</Button>
		</Modal.Footer>
	</Modal.Content>
</Modal.Root>
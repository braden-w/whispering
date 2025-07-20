<script lang="ts">
	import * as Dialog from '@repo/ui/dialog';
	import { Button } from '@repo/ui/button';
	import { Input } from '@repo/ui/input';
	import { Label } from '@repo/ui/label';
	import * as Card from '@repo/ui/card';
	import * as Tabs from '@repo/ui/tabs';
	import { createWorkspace, generateRandomPort } from '$lib/stores/workspaces.svelte';
	import { toast } from 'svelte-sonner';
	import { Copy, CheckCircle2, Loader2 } from 'lucide-svelte';
	import * as api from '$lib/client/sdk.gen';
	import { createWorkspaceClient } from '$lib/client/workspace-client';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	let open = $state(false);

	// Form state
	let step = $state(1);
	let username = $state('user');
	let password = $state('password');
	let port = $state(generateRandomPort());
	let ngrokUrl = $state('');
	let workspaceName = $state('');
	let isTesting = $state(false);
	let testSuccess = $state(false);

	// Reset form when dialog opens
	$effect(() => {
		if (open) {
			step = 1;
			username = 'user';
			password = 'password';
			port = generateRandomPort();
			ngrokUrl = '';
			workspaceName = '';
			isTesting = false;
			testSuccess = false;
		}
	});

	// Commands for copy functionality
	const opencodeCommand = $derived(`opencode serve -p ${port}` as const);
	const ngrokCommand = $derived(
		`ngrok http ${port} --basic-auth="${username}:${password}"` as const
	);
	const quickSetupCommand = $derived(
		`${opencodeCommand} & ${ngrokCommand}; kill $!` as const
	);

	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			toast.success('Copied to clipboard');
		} catch {
			toast.error('Failed to copy to clipboard');
		}
	}

	async function testConnection() {
		if (!ngrokUrl || !username || !password) {
			toast.error('Please fill in all fields');
			return;
		}

		isTesting = true;
		testSuccess = false;

		try {
			// Test the connection using the API client
			const testWorkspace = {
				id: 'test',
				name: 'test',
				url: ngrokUrl,
				port,
				username,
				password,
				createdAt: 0,
				lastAccessedAt: 0
			};

			const client = createWorkspaceClient(testWorkspace);
			const { error } = await api.getApp({ client });

			if (error) {
				toast.error('Connection failed', {
					description: 'Please check your URL and credentials'
				});
			} else {
				testSuccess = true;
				toast.success('Connection successful!');
			}
		} catch (err) {
			toast.error('Connection failed', {
				description: err instanceof Error ? err.message : 'Unknown error'
			});
		} finally {
			isTesting = false;
		}
	}

	function handleCreate() {
		if (!workspaceName.trim()) {
			toast.error('Please enter a workspace name');
			return;
		}

		if (!testSuccess) {
			toast.error('Please test the connection first');
			return;
		}

		createWorkspace({
			name: workspaceName.trim(),
			url: ngrokUrl,
			port,
			username,
			password
		});

		toast.success(`Created workspace "${workspaceName}"`);
		open = false;
	}

	function nextStep() {
		if (step === 1 && (!username || !password)) {
			toast.error('Please enter username and password');
			return;
		}
		if (step === 2 && !port) {
			toast.error('Please enter a valid port number');
			return;
		}
		step++;
	}

	function previousStep() {
		step--;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		{@render children?.()}
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>Add New Workspace</Dialog.Title>
			<Dialog.Description>
				Connect to an OpenCode server in {step === 1 ? 'a few' : step - 1} easy steps
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4">
			{#if step === 1}
				<!-- Step 1: Credentials -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg">Step 1: Set Credentials</Card.Title>
						<Card.Description>
							These will be used for basic authentication
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="space-y-2">
							<Label for="username">Username</Label>
							<Input
								id="username"
								bind:value={username}
								placeholder="Enter username"
								autocomplete="off"
							/>
						</div>
						<div class="space-y-2">
							<Label for="password">Password</Label>
							<Input
								id="password"
								type="password"
								bind:value={password}
								placeholder="Enter password"
								autocomplete="new-password"
							/>
						</div>
					</Card.Content>
				</Card.Root>
			{:else if step === 2}
				<!-- Step 2: Port Selection -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg">Step 2: Select Port</Card.Title>
						<Card.Description>
							Choose a port for your OpenCode server
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="space-y-2">
							<Label for="port">Port Number</Label>
							<Input
								id="port"
								type="number"
								bind:value={port}
								min="1024"
								max="65535"
							/>
							<p class="text-sm text-muted-foreground">
								A random port has been generated for you
							</p>
						</div>
					</Card.Content>
				</Card.Root>
			{:else if step === 3}
				<!-- Step 3: Setup Instructions -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg">Step 3: Start OpenCode Server</Card.Title>
						<Card.Description>
							Run the following commands to start your server
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4">
						<Tabs.Root value="separate" class="w-full">
							<Tabs.List class="grid w-full grid-cols-2">
								<Tabs.Trigger value="separate">Separate Commands</Tabs.Trigger>
								<Tabs.Trigger value="combined">Combined (One Line)</Tabs.Trigger>
							</Tabs.List>
							<Tabs.Content value="separate" class="space-y-4">
								<div class="space-y-4">
									<div>
										<p class="text-sm text-muted-foreground mb-2">In your project directory, run:</p>
										<div class="flex items-center gap-2">
											<code class="flex-1 bg-muted p-2 rounded text-sm">
												{opencodeCommand}
											</code>
											<Button
												size="icon"
												variant="ghost"
												onclick={() => copyToClipboard(opencodeCommand)}
											>
												<Copy class="h-4 w-4" />
											</Button>
										</div>
									</div>
									<div>
										<p class="text-sm text-muted-foreground mb-2">In another terminal, run:</p>
										<div class="flex items-center gap-2">
											<code class="flex-1 bg-muted p-2 rounded text-sm break-all">
												{ngrokCommand}
											</code>
											<Button
												size="icon"
												variant="ghost"
												onclick={() => copyToClipboard(ngrokCommand)}
											>
												<Copy class="h-4 w-4" />
											</Button>
										</div>
									</div>
								</div>
							</Tabs.Content>
							<Tabs.Content value="combined" class="space-y-4">
								<p class="text-sm text-muted-foreground">Run both commands in one line:</p>
								<div class="flex items-center gap-2">
									<code class="flex-1 bg-muted p-2 rounded text-sm break-all">
										{quickSetupCommand}
									</code>
									<Button
										size="icon"
										variant="ghost"
										onclick={() => copyToClipboard(quickSetupCommand)}
									>
										<Copy class="h-4 w-4" />
									</Button>
								</div>
							</Tabs.Content>
						</Tabs.Root>
					</Card.Content>
				</Card.Root>
			{:else if step === 4}
				<!-- Step 4: Enter ngrok URL -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg">Step 4: Enter ngrok URL</Card.Title>
						<Card.Description>
							Copy the HTTPS URL from ngrok output
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="space-y-2">
							<Label for="ngrokUrl">ngrok URL</Label>
							<Input
								id="ngrokUrl"
								bind:value={ngrokUrl}
								placeholder="https://abc123.ngrok.io"
							/>
						</div>
						<Button
							onclick={testConnection}
							disabled={isTesting || !ngrokUrl}
							class="w-full"
						>
							{#if isTesting}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								Testing Connection...
							{:else if testSuccess}
								<CheckCircle2 class="mr-2 h-4 w-4" />
								Connection Successful
							{:else}
								Test Connection
							{/if}
						</Button>
					</Card.Content>
				</Card.Root>
			{:else if step === 5}
				<!-- Step 5: Name Workspace -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg">Step 5: Name Your Workspace</Card.Title>
						<Card.Description>
							Give this workspace a memorable name
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="space-y-2">
							<Label for="workspaceName">Workspace Name</Label>
							<Input
								id="workspaceName"
								bind:value={workspaceName}
								placeholder="My Project"
							/>
						</div>
						{#if testSuccess}
							<div class="flex items-center gap-2 text-sm text-green-600">
								<CheckCircle2 class="h-4 w-4" />
								Connection verified
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			{/if}
		</div>

		<Dialog.Footer>
			<div class="flex items-center justify-between w-full">
				<div>
					{#if step > 1}
						<Button variant="outline" onclick={previousStep}>
							Previous
						</Button>
					{/if}
				</div>
				<div class="flex gap-2">
					<Dialog.Close>
						<Button variant="outline">Cancel</Button>
					</Dialog.Close>
					{#if step < 5}
						<Button onclick={nextStep}>
							Next
						</Button>
					{:else}
						<Button
							onclick={handleCreate}
							disabled={!testSuccess || !workspaceName.trim()}
						>
							Create Workspace
						</Button>
					{/if}
				</div>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
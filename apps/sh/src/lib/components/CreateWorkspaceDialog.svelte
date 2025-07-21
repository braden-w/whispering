<script lang="ts">
	import * as Dialog from '@repo/ui/dialog';
	import { Button, type Props as ButtonProps } from '@repo/ui/button';
	import { Input } from '@repo/ui/input';
	import { Label } from '@repo/ui/label';
	import * as Card from '@repo/ui/card';
	import * as Tabs from '@repo/ui/tabs';
	import * as Accordion from '@repo/ui/accordion';
	import {
		createWorkspace,
		generateRandomPort,
	} from '$lib/stores/workspaces.svelte';
	import { toast } from 'svelte-sonner';
	import { Copy, CheckCircle2, Loader2, Sparkles } from 'lucide-svelte';
	import * as api from '$lib/client/sdk.gen';
	import { createWorkspaceClient } from '$lib/client/workspace-client';
	import { getProxiedBaseUrl } from '$lib/client/utils/proxy-url';
	import { type } from 'arktype';
	import type { Snippet } from 'svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import type { App } from '$lib/client/types.gen';

	let { triggerChild }: { triggerChild: Snippet<[{ props: ButtonProps }]> } =
		$props();

	let open = $state(false);

	// Form state
	let step = $state(1);
	let username = $state(settings.value.defaultUsername);
	let password = $state(settings.value.defaultPassword);
	let port = $state(generateRandomPort());
	let ngrokUrl = $state('');
	let workspaceName = $state('');
	let isTesting = $state(false);
	let testSuccess = $state(false);
	let isDetecting = $state(false);
	let appInfo = $state<App | null>(null);

	// Define the ngrok API response schema using arktype
	const NgrokTunnelsResponse = type('string.json.parse').to({
		tunnels: [
			{
				name: 'string',
				uri: 'string',
				public_url: 'string',
				proto: '"http" | "https"',
				config: {
					addr: 'string',
					inspect: 'boolean',
				},
			},
		],
		uri: 'string',
	});

	// Reset form when dialog opens
	$effect(() => {
		if (open) {
			step = 1;
			username = settings.value.defaultUsername;
			password = settings.value.defaultPassword;
			port = generateRandomPort();
			ngrokUrl = '';
			workspaceName = '';
			isTesting = false;
			testSuccess = false;
			appInfo = null;
		}
	});

	// Pre-populate workspace name when reaching step 3
	$effect(() => {
		if (step === 3 && !workspaceName && appInfo?.path) {
			workspaceName = appInfo.path.cwd;
		}
	});

	// Commands for copy functionality
	const opencodeCommand = $derived(`opencode serve -p ${port}` as const);
	const ngrokCommand = $derived(
		`ngrok http ${port} --basic-auth="${username}:${password}"` as const,
	);
	const quickSetupCommand = $derived(
		`${opencodeCommand} & ${ngrokCommand}; kill $!` as const,
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
				lastAccessedAt: 0,
			};

			const client = createWorkspaceClient(testWorkspace);
			const { data, error } = await api.getApp({ client });

			if (error) {
				toast.error('Connection failed', {
					description: 'Please check your URL and credentials',
				});
			} else if (data) {
				testSuccess = true;
				appInfo = data;

				// Pre-populate workspace name with current working directory
				if (!workspaceName && data.path) {
					workspaceName = data.path.cwd;
				}

				toast.success('Connection successful!');
			}
		} catch (err) {
			toast.error('Connection failed', {
				description: err instanceof Error ? err.message : 'Unknown error',
			});
		} finally {
			isTesting = false;
		}
	}

	async function autoDetectNgrokUrl() {
		isDetecting = true;
		try {
			const ngrokApiUrl = getProxiedBaseUrl('http://localhost:4040');
			const response = await fetch(`${ngrokApiUrl}/api/tunnels`);

			if (!response.ok) {
				throw new Error(
					'ngrok API not accessible. Make sure ngrok is running.',
				);
			}

			const text = await response.text();
			const parsed = NgrokTunnelsResponse(text);

			if (parsed instanceof type.errors) {
				console.error('Invalid ngrok response:', parsed.summary);
				throw new Error('Invalid response from ngrok');
			}

			// Find HTTPS tunnel that matches our port
			const httpsTunnel = parsed.tunnels.find(
				(t) => t.proto === 'https' && t.config.addr.includes(`:${port}`),
			);

			if (httpsTunnel) {
				ngrokUrl = httpsTunnel.public_url;
				toast.success('ngrok URL detected successfully!');
			} else {
				// Check if there's any tunnel for our port
				const anyTunnel = parsed.tunnels.find((t) =>
					t.config.addr.includes(`:${port}`),
				);
				if (anyTunnel) {
					toast.error(
						`Found tunnel but it's not HTTPS. Make sure to run: ${ngrokCommand}`,
					);
				} else {
					toast.error(
						`No tunnel found for port ${port}. Make sure ngrok is running with the correct port.`,
					);
				}
			}
		} catch (error) {
			toast.error('Could not detect ngrok URL', {
				description:
					error instanceof Error ? error.message : 'Please enter manually',
			});
		} finally {
			isDetecting = false;
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
			password,
		});

		toast.success(`Created workspace "${workspaceName}"`);
		open = false;
	}

	function nextStep() {
		step++;
	}

	function previousStep() {
		step--;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		{#snippet child({ props })}
			{@render triggerChild({ props })}
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>Add New Workspace</Dialog.Title>
			<Dialog.Description>
				Connect to an OpenCode server in a few easy steps
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4">
			{#if step === 1}
				<!-- Step 1: Start OpenCode Server -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg"
							>Step 1: Start OpenCode Server</Card.Title
						>
						<Card.Description>
							Run the following commands to start your server
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4">
						<!-- Configuration Accordion -->
						<Accordion.Root>
							<Accordion.Item value="config">
								<Accordion.Trigger>Configure Server Settings</Accordion.Trigger>
								<Accordion.Content>
									<div class="space-y-4 pt-4">
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
										<p class="text-sm text-muted-foreground">
											These credentials are pre-filled from your settings.
											Changes here only affect this workspace.
										</p>
									</div>
								</Accordion.Content>
							</Accordion.Item>
						</Accordion.Root>
						<Tabs.Root value="separate" class="w-full">
							<Tabs.List class="grid w-full grid-cols-2">
								<Tabs.Trigger value="separate">Separate Commands</Tabs.Trigger>
								<Tabs.Trigger value="combined">Combined (One Line)</Tabs.Trigger
								>
							</Tabs.List>
							<Tabs.Content value="separate" class="space-y-4">
								<div class="space-y-4">
									<div>
										<p class="text-sm text-muted-foreground mb-2">
											In your project directory, run:
										</p>
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
										<p class="text-sm text-muted-foreground mb-2">
											In another terminal, run:
										</p>
										<div class="flex items-center gap-2">
											<code
												class="flex-1 bg-muted p-2 rounded text-sm break-all"
											>
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
								<p class="text-sm text-muted-foreground">
									Run both commands in one line:
								</p>
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
			{:else if step === 2}
				<!-- Step 2: Enter ngrok URL -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg">Step 2: Enter ngrok URL</Card.Title>
						<Card.Description>
							Copy the HTTPS URL from ngrok output
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="space-y-2">
							<Label for="ngrokUrl">ngrok URL</Label>
							<div class="flex gap-2">
								<Input
									id="ngrokUrl"
									bind:value={ngrokUrl}
									placeholder="https://abc123.ngrok.io"
									class="flex-1"
								/>
								<Button
									variant="outline"
									size="icon"
									onclick={autoDetectNgrokUrl}
									disabled={isDetecting}
									title="Auto-detect ngrok URL"
								>
									{#if isDetecting}
										<Loader2 class="h-4 w-4 animate-spin" />
									{:else}
										<Sparkles class="h-4 w-4" />
									{/if}
								</Button>
							</div>
							<p class="text-sm text-muted-foreground">
								Make sure ngrok is running on the default port (4040)
							</p>
						</div>

						<!-- Visual guide -->
						<div class="rounded-md bg-muted p-3">
							<p class="text-sm font-medium mb-2">
								Look for this in your ngrok output:
							</p>
							<code class="text-xs block">
								Forwarding https://abc123.ngrok.io → http://localhost:{port}
							</code>
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
			{:else if step === 3}
				<!-- Step 3: Name Workspace -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg">Step 3: Name Your Workspace</Card.Title>
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
							{#if appInfo?.path}
								<p class="text-sm text-muted-foreground">
									Using current working directory as default name
								</p>
							{/if}
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
						<Button variant="outline" onclick={previousStep}>Previous</Button>
					{/if}
				</div>
				<div class="flex gap-2">
					<Dialog.Close>
						<Button variant="outline">Cancel</Button>
					</Dialog.Close>
					{#if step < 3}
						<Button onclick={nextStep}>Next</Button>
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

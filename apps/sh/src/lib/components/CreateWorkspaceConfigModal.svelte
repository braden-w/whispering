<script lang="ts">
	import * as Modal from '@repo/ui/modal';
	import { Button, type Props as ButtonProps } from '@repo/ui/button';
	import { Input } from '@repo/ui/input';
	import { Label } from '@repo/ui/label';
	import * as Card from '@repo/ui/card';
	import * as Tabs from '@repo/ui/tabs';
	import * as Accordion from '@repo/ui/accordion';
	import {
		createWorkspaceConfig,
		generateAvailablePort,
	} from '$lib/stores/workspace-configs.svelte';
	import { toast } from 'svelte-sonner';
	import { Copy, CheckCircle2, Loader2, Sparkles } from 'lucide-svelte';
	import * as api from '$lib/client/sdk.gen';
	import { createWorkspaceClient } from '$lib/client/client.gen';
	import { type } from 'arktype';
	import type { Snippet } from 'svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import type { App } from '$lib/client/types.gen';

	let { triggerChild }: { triggerChild: Snippet<[{ props: ButtonProps }]> } =
		$props();

	let open = $state(false);
	let isCheckingPorts = $state(false);

	// Form state
	let step = $state(1);
	let password = $state(settings.value.defaultPassword);
	let port = $state(4096); // Default port
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
			password = settings.value.defaultPassword;
			ngrokUrl = '';
			workspaceName = '';
			isTesting = false;
			testSuccess = false;
			appInfo = null;
			
			// Generate available port asynchronously
			generateAvailablePort().then(availablePort => {
				port = availablePort;
			});
		}
	});

	// Pre-populate workspace name when reaching step 3
	$effect(() => {
		if (step === 3 && !workspaceName && appInfo?.path) {
			workspaceName = appInfo.path.cwd;
		}
	});

	// Port configuration constants
	const NGROK_API_PORT = 4040; // Default ngrok API port
	const NGROK_PROXY_PORT = 4080; // Caddy proxy port for ngrok API

	// Commands for copy functionality
	const opencodeCommand = $derived(`opencode serve -p ${port}` as const);
	const ngrokCommand = $derived(`ngrok http ${port}` as const);
	const combinedCommand = $derived(`opencode serve -p ${port} & ngrok http ${port}; kill $!` as const);
	// Optional Caddy command for ngrok API auto-detection only
	const caddyCommand = $derived(
		`caddy run --config - --adapter caddyfile << EOF
:${NGROK_PROXY_PORT} {
    # Add CORS headers to all responses
    header Access-Control-Allow-Origin "http://localhost:5173"
    header Access-Control-Allow-Methods "GET, POST, OPTIONS"
    header Access-Control-Allow-Headers "*"
    header Access-Control-Allow-Credentials "true"

    # Handle preflight OPTIONS requests and respond immediately
    @options {
        method OPTIONS
    }
    respond @options 204

    # Proxy all other requests to ngrok API
    reverse_proxy localhost:${NGROK_API_PORT}
}
EOF` as const
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
		if (!ngrokUrl || !password) {
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
			// Use the proxy API route for ngrok detection
			const response = await fetch(`http://localhost:${NGROK_PROXY_PORT}/api/tunnels`);

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

			// Find HTTPS tunnel that matches our OpenCode port
			const httpsTunnel = parsed.tunnels.find(
				(t) => t.proto === 'https' && t.config.addr.includes(`:${port}`),
			);

			if (httpsTunnel) {
				ngrokUrl = httpsTunnel.public_url;
				toast.success('ngrok URL detected successfully!');
			} else {
				// Check if there's any tunnel for our OpenCode port
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

		createWorkspaceConfig({
			name: workspaceName.trim(),
			url: ngrokUrl,
			port,
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

<Modal.Root bind:open>
	<Modal.Trigger>
		{#snippet child({ props })}
			{@render triggerChild({ props })}
		{/snippet}
	</Modal.Trigger>
	<Modal.Content class="sm:max-w-[600px]">
		<Modal.Header>
			<Modal.Title>Add New Workspace</Modal.Title>
			<Modal.Description>
				Connect to an OpenCode server in a few easy steps
			</Modal.Description>
		</Modal.Header>

		<div class="space-y-4">
			{#if step === 1}
				<!-- Step 1: Setup Commands -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg">Step 1: Setup Commands</Card.Title>
						<Card.Description>
							Run these commands in separate terminals to set up your server
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4">
						<!-- Command Options Tabs -->
						<Tabs.Root value="separate">
							<Tabs.List class="grid w-full grid-cols-2">
								<Tabs.Trigger value="separate">Separate Commands</Tabs.Trigger>
								<Tabs.Trigger value="combined">Combined Command</Tabs.Trigger>
							</Tabs.List>
							
							<Tabs.Content value="separate" class="space-y-6 mt-4">
								<!-- Command 1: OpenCode -->
								<div class="space-y-2">
									<div class="flex items-center gap-2">
										<div class="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
											1
										</div>
										<p class="text-sm font-medium">Start OpenCode server</p>
									</div>
									<div class="flex items-center gap-2 ml-10">
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

								<!-- Command 2: ngrok -->
								<div class="space-y-2">
									<div class="flex items-center gap-2">
										<div class="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
											2
										</div>
										<p class="text-sm font-medium">Expose to internet with ngrok (optional)</p>
									</div>
									<div class="flex items-center gap-2 ml-10">
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
							</Tabs.Content>
							
							<Tabs.Content value="combined" class="space-y-6 mt-4">
								<div class="space-y-2">
									<p class="text-sm font-medium">Run both OpenCode and ngrok in one command</p>
									<div class="flex items-center gap-2">
										<code class="flex-1 bg-muted p-2 rounded text-sm break-all">
											{combinedCommand}
										</code>
										<Button
											size="icon"
											variant="ghost"
											onclick={() => copyToClipboard(combinedCommand)}
										>
											<Copy class="h-4 w-4" />
										</Button>
									</div>
									<p class="text-sm text-muted-foreground">
										This command runs both servers and kills them together when you stop
									</p>
								</div>
							</Tabs.Content>
						</Tabs.Root>

						<!-- Explanation -->
						<Accordion.Root type="single" collapsible>
							<Accordion.Item value="explanation">
								<Accordion.Trigger>How does this setup work?</Accordion.Trigger>
								<Accordion.Content>
									<div class="space-y-3 pt-2">
										<p class="text-sm text-muted-foreground">
											This setup uses a simplified architecture:
										</p>
										<ol class="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-4">
											<li><strong>OpenCode</strong>: Runs on port {port} with built-in CORS support</li>
											<li><strong>ngrok</strong>: Creates a secure tunnel to expose your OpenCode server to the internet</li>
										</ol>
										<p class="text-sm text-muted-foreground">
											Authentication is now handled at the OpenCode level. ngrok provides the secure tunnel without requiring basic auth.
										</p>
									</div>
								</Accordion.Content>
							</Accordion.Item>
						</Accordion.Root>

						<!-- Configuration Accordion -->
						<Accordion.Root type="single" collapsible>
							<Accordion.Item value="config">
								<Accordion.Trigger>Configure Server Settings</Accordion.Trigger>
								<Accordion.Content>
									<div class="space-y-4 pt-4">
										<div class="space-y-2">
											<Label for="port">OpenCode Port</Label>
											<Input
												id="port"
												type="number"
												bind:value={port}
												min="1024"
												max="65535"
											/>
										</div>
										<p class="text-sm text-muted-foreground">
											A port has been generated for you. Make sure it doesn't conflict with existing services.
										</p>
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
											This password is pre-filled from your settings.
											Changes here only affect this workspace.
										</p>
									</div>
								</Accordion.Content>
							</Accordion.Item>
						</Accordion.Root>

						<!-- Optional Caddy for ngrok auto-detection -->
						<Accordion.Root type="single" collapsible>
							<Accordion.Item value="caddy">
								<Accordion.Trigger>Optional: Enable ngrok Auto-Detection</Accordion.Trigger>
								<Accordion.Content>
									<div class="space-y-3 pt-2">
										<p class="text-sm text-muted-foreground">
											If you want the "Auto-detect" button to work for ngrok URLs, run this Caddy proxy:
										</p>
										<div class="flex items-start gap-2">
											<code class="flex-1 bg-muted p-2 rounded text-sm whitespace-pre">{caddyCommand}</code>
											<Button
												size="icon"
												variant="ghost"
												onclick={() => copyToClipboard(caddyCommand)}
											>
												<Copy class="h-4 w-4" />
											</Button>
										</div>
										<p class="text-sm text-muted-foreground">
											This proxies localhost:{NGROK_PROXY_PORT} → localhost:{NGROK_API_PORT} to work around CORS restrictions when detecting ngrok URLs.
										</p>
									</div>
								</Accordion.Content>
							</Accordion.Item>
						</Accordion.Root>
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

		<Modal.Footer>
			<div class="flex items-center justify-between w-full">
				<div>
					{#if step > 1}
						<Button variant="outline" onclick={previousStep}>Previous</Button>
					{/if}
				</div>
				<div class="flex gap-2">
					<Button variant="outline" onclick={() => open = false}>Cancel</Button>
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
		</Modal.Footer>
	</Modal.Content>
</Modal.Root>

<script lang="ts">
	import type { App } from '$lib/client/types.gen';
	import type { Snippet } from 'svelte';

	import { createWorkspaceClient } from '$lib/client/client.gen';
	import * as api from '$lib/client/sdk.gen';
	import { settings } from '$lib/stores/settings.svelte';
	import {
		createWorkspaceConfig,
		generateAvailablePort,
	} from '$lib/stores/workspace-configs.svelte';
	import * as Accordion from '@repo/ui/accordion';
	import { Button, type Props as ButtonProps } from '@repo/ui/button';
	import * as Card from '@repo/ui/card';
	import { Input } from '@repo/ui/input';
	import { Label } from '@repo/ui/label';
	import * as Modal from '@repo/ui/modal';
	import * as Tabs from '@repo/ui/tabs';
	import { type } from 'arktype';
	import { CheckCircle2, Copy, Loader2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

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
	let appInfo = $state<App | null>(null);


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
			generateAvailablePort().then((availablePort) => {
				port = availablePort;
			});
		}
	});



	// Commands for copy functionality
	const npmCommand = $derived(`npx @getepicenter/opencode serve --tunnel --cors-origins https://epicenter.sh` as const);
	const pnpmCommand = $derived(`pnpm dlx @getepicenter/opencode serve --tunnel --cors-origins https://epicenter.sh` as const);
	const bunxCommand = $derived(`bunx @getepicenter/opencode serve --tunnel --cors-origins https://epicenter.sh` as const);
	
	// Manual setup commands
	const opencodeCommand = $derived(`opencode serve -p ${port}` as const);
	const ngrokCommand = $derived(`ngrok http ${port}` as const);
	const cloudflaredCommand = $derived(`cloudflared tunnel --url http://localhost:${port}` as const);

	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			toast.success('Copied to clipboard');
		} catch {
			toast.error('Failed to copy to clipboard');
		}
	}

	async function testConnection() {
		if (!ngrokUrl) {
			toast.error('Please enter a URL');
			return;
		}

		isTesting = true;
		testSuccess = false;

		try {
			// Test the connection using the API client
			const testWorkspace = {
				createdAt: 0,
				id: 'test',
				lastAccessedAt: 0,
				name: 'test',
				password,
				port,
				url: ngrokUrl,
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
			password,
			port,
			url: ngrokUrl,
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
				<!-- Step 1: Setup Method -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg">Choose Setup Method</Card.Title>
						<Card.Description>
							Select how you want to connect to OpenCode
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4">
						<Tabs.Root value="quick">
							<Tabs.List class="grid w-full grid-cols-2">
								<Tabs.Trigger value="quick">Quick Setup (Recommended)</Tabs.Trigger>
								<Tabs.Trigger value="manual">Manual Setup</Tabs.Trigger>
							</Tabs.List>

							<Tabs.Content value="quick" class="space-y-4 mt-4">
								<div class="rounded-lg bg-muted p-4">
									<p class="text-sm font-medium mb-3">
										Run one of these commands to automatically set up your workspace:
									</p>
									
									<!-- npm command -->
									<div class="space-y-3">
										<div class="space-y-1">
											<p class="text-xs text-muted-foreground font-medium">npm</p>
											<div class="flex items-center gap-2">
												<code class="flex-1 bg-background p-2 rounded text-sm">
													{npmCommand}
												</code>
												<Button
													size="icon"
													variant="ghost"
													onclick={() => copyToClipboard(npmCommand)}
												>
													<Copy class="h-4 w-4" />
												</Button>
											</div>
										</div>
										
										<!-- pnpm command -->
										<div class="space-y-1">
											<p class="text-xs text-muted-foreground font-medium">pnpm</p>
											<div class="flex items-center gap-2">
												<code class="flex-1 bg-background p-2 rounded text-sm">
													{pnpmCommand}
												</code>
												<Button
													size="icon"
													variant="ghost"
													onclick={() => copyToClipboard(pnpmCommand)}
												>
													<Copy class="h-4 w-4" />
												</Button>
											</div>
										</div>
										
										<!-- bun command -->
										<div class="space-y-1">
											<p class="text-xs text-muted-foreground font-medium">bun</p>
											<div class="flex items-center gap-2">
												<code class="flex-1 bg-background p-2 rounded text-sm">
													{bunxCommand}
												</code>
												<Button
													size="icon"
													variant="ghost"
													onclick={() => copyToClipboard(bunxCommand)}
												>
													<Copy class="h-4 w-4" />
												</Button>
											</div>
										</div>
									</div>
								</div>
								
								<div class="space-y-2">
									<p class="text-sm font-medium">What this command does:</p>
									<ul class="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
										<li>Starts the OpenCode server</li>
										<li>Sets up a secure tunnel automatically</li>
										<li>Opens this page with everything pre-filled</li>
										<li>You just click "Create" to confirm</li>
									</ul>
								</div>
							</Tabs.Content>

							<Tabs.Content value="manual" class="space-y-4 mt-4">
								<p class="text-sm text-muted-foreground">
									Manually set up your server and tunnel in separate steps
								</p>
								
								<!-- Step 1: Start OpenCode -->
								<div class="space-y-2">
									<div class="flex items-center gap-2">
										<div
											class="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium"
										>
											1
										</div>
										<p class="text-sm font-medium">Start OpenCode server</p>
									</div>
									<div class="flex items-center gap-2 ml-8">
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
								
								<!-- Step 2: Choose tunnel -->
								<div class="space-y-2">
									<div class="flex items-center gap-2">
										<div
											class="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium"
										>
											2
										</div>
										<p class="text-sm font-medium">Create a tunnel (choose one)</p>
									</div>
									
									<Accordion.Root type="single" class="ml-8">
										<Accordion.Item value="cloudflared">
											<Accordion.Trigger class="text-sm">Cloudflared (Recommended)</Accordion.Trigger>
											<Accordion.Content>
												<div class="space-y-2 pt-2">
													<div class="flex items-center gap-2">
														<code class="flex-1 bg-muted p-2 rounded text-sm">
															{cloudflaredCommand}
														</code>
														<Button
															size="icon"
															variant="ghost"
															onclick={() => copyToClipboard(cloudflaredCommand)}
														>
															<Copy class="h-4 w-4" />
														</Button>
													</div>
													<p class="text-sm text-muted-foreground">
														No account required. Copy the generated URL from the output.
													</p>
												</div>
											</Accordion.Content>
										</Accordion.Item>
										
										<Accordion.Item value="ngrok">
											<Accordion.Trigger class="text-sm">ngrok</Accordion.Trigger>
											<Accordion.Content>
												<div class="space-y-2 pt-2">
													<div class="flex items-center gap-2">
														<code class="flex-1 bg-muted p-2 rounded text-sm">
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
													<p class="text-sm text-muted-foreground">
														Requires ngrok account. Copy the HTTPS URL from the output.
													</p>
												</div>
											</Accordion.Content>
										</Accordion.Item>
									</Accordion.Root>
								</div>
							</Tabs.Content>
						</Tabs.Root>

						<!-- Advanced Settings (only in manual tab) -->
						{#if step === 1}
							<Accordion.Root type="single">
								<Accordion.Item value="config">
									<Accordion.Trigger>Advanced Settings</Accordion.Trigger>
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
												Change this if the default port conflicts with other services.
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
												Pre-filled from your settings. Changes here only affect this workspace.
											</p>
										</div>
									</Accordion.Content>
								</Accordion.Item>
							</Accordion.Root>
						{/if}

					</Card.Content>
				</Card.Root>
			{:else if step === 2}
				<!-- Step 2: Enter URL & Name -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg">Step 2: Connect to Your Server</Card.Title>
						<Card.Description>
							Enter the URL from your tunnel provider
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="space-y-2">
							<Label for="ngrokUrl">Server URL</Label>
							<div class="flex gap-2">
								<Input
									id="ngrokUrl"
									bind:value={ngrokUrl}
									placeholder="https://your-tunnel-url.example.com"
									class="flex-1"
								/>
							</div>
							<p class="text-sm text-muted-foreground">
								Paste the URL from cloudflared, ngrok, or your tunnel provider
							</p>
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
						
						{#if testSuccess && appInfo}
							<div class="space-y-4 pt-4 border-t">
								<div class="space-y-2">
									<Label for="workspaceName">Workspace Name</Label>
									<Input
										id="workspaceName"
										bind:value={workspaceName}
										placeholder="My Project"
									/>
									{#if appInfo.path}
										<p class="text-sm text-muted-foreground">
											Auto-filled from current working directory
										</p>
									{/if}
								</div>
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
					<Button variant="outline" onclick={() => (open = false)}
						>Cancel</Button
					>
					{#if step === 1}
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

<script lang="ts">
	import type { App } from '$lib/client/types.gen';
	import type { Snippet } from 'svelte';

	import { goto } from '$app/navigation';
	import { createAssistantClient } from '$lib/client/client.gen';
	import * as api from '$lib/client/sdk.gen';
	import * as rpc from '$lib/query';
	import { generateAvailablePort, type URL } from '$lib/utils/port';
	import { settings } from '$lib/stores/settings.svelte';
	import * as Accordion from '@repo/ui/accordion';
	import { Button, type Props as ButtonProps } from '@repo/ui/button';
	import { Input } from '@repo/ui/input';
	import { Label } from '@repo/ui/label';
	import * as Modal from '@repo/ui/modal';
	import { PMCommand } from '@repo/ui/pm-command';
	import * as Tabs from '@repo/ui/tabs';
	import { createMutation } from '@tanstack/svelte-query';
	import { CheckCircle2, Copy, Loader2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let { triggerChild }: { triggerChild: Snippet<[{ props: ButtonProps }]> } =
		$props();

	let open = $state(false);

	// Form state
	let password = $state(settings.value.defaultPassword);
	let port = $state(4096); // Default port
	let ngrokUrl = $state('');
	let assistantName = $state('');
	let isTesting = $state(false);
	let testSuccess = $state(false);
	let appInfo = $state<App | null>(null);

	// Create mutation for adding assistant config
	const createAssistantMutation = createMutation(
		rpc.assistantConfigs.createAssistantConfig.options,
	);

	// Reset form when dialog opens
	$effect(() => {
		if (open) {
			password = settings.value.defaultPassword;
			ngrokUrl = '';
			assistantName = '';
			isTesting = false;
			testSuccess = false;
			appInfo = null;

			// Generate available port asynchronously
			generateAvailablePort().then((availablePort) => {
				port = availablePort;
			});
		}
	});

	// Manual setup commands (non-PM commands)
	const opencodeCommand = $derived(`opencode serve -p ${port}` as const);
	const ngrokCommand = $derived(`ngrok http ${port}` as const);
	const cloudflaredCommand = $derived(
		`cloudflared tunnel --url http://localhost:${port}` as const,
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
		if (!ngrokUrl) {
			toast.error('Please enter a URL');
			return;
		}

		isTesting = true;
		testSuccess = false;

		try {
			// Test the connection using the API client
			const testAssistant = {
				createdAt: 0,
				id: 'test',
				lastAccessedAt: 0,
				name: 'test',
				password,
				url: ngrokUrl as URL,
			};

			const client = createAssistantClient(testAssistant);
			const { data, error } = await api.getApp({ client });

			if (error) {
				toast.error('Connection failed', {
					description: 'Please check your URL and credentials',
				});
			} else if (data) {
				testSuccess = true;
				appInfo = data;

				// Pre-populate assistant name with current working directory
				if (!assistantName && data.path) {
					assistantName = data.path.cwd;
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
		if (!assistantName.trim()) {
			toast.error('Please enter an assistant name');
			return;
		}

		if (!testSuccess) {
			toast.error('Please test the connection first');
			return;
		}

		createAssistantMutation.mutate(
			{
				name: assistantName.trim(),
				password,
				url: ngrokUrl,
			},
			{
				onSuccess: (data) => {
					toast.success(`Created assistant "${assistantName}"`);
					open = false;
					// Navigate to the new assistant
					goto(`/assistants/${data.id}`);
				},
				onError: (error) => {
					toast.error(error.title, { description: error.description });
				},
			},
		);
	}
</script>

<Modal.Root bind:open>
	<Modal.Trigger>
		{#snippet child({ props })}
			{@render triggerChild({ props })}
		{/snippet}
	</Modal.Trigger>
	<Modal.Content class="sm:max-w-[600px] max-h-[70vh] overflow-y-auto">
		<Modal.Header>
			<Modal.Title>Add New Assistant</Modal.Title>
			<Modal.Description>
				Connect to an OpenCode server using the epicenter CLI
			</Modal.Description>
		</Modal.Header>

		<Tabs.Root value="quick" class="space-y-4">
			<Tabs.List class="grid w-full grid-cols-2">
				<Tabs.Trigger value="quick">Quick Setup</Tabs.Trigger>
				<Tabs.Trigger value="manual">Manual Setup</Tabs.Trigger>
			</Tabs.List>

			<!-- Quick Setup Tab -->
			<Tabs.Content value="quick" class="space-y-4 mt-4">
				<div class="space-y-4">
					<div class="space-y-2">
						<p class="text-sm text-muted-foreground">
							Run this command to start your server and add the assistant
							automatically:
						</p>
					</div>

					<PMCommand
						command="execute"
						args={['@epicenter/cli@latest', 'sh']}
						agent="bun"
						agents={['bun']}
					/>

					<div class="space-y-2">
						<p class="text-sm font-medium">What this does:</p>
						<ul
							class="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2"
						>
							<li>Starts OpenCode server (our fork with CORS support)</li>
							<li>Creates a secure tunnel via Cloudflare</li>
							<li>Opens epicenter.sh with your assistant pre-configured</li>
							<li>No manual configuration needed</li>
						</ul>
						<p class="text-sm text-muted-foreground mt-2">
							Learn more about how it works in our <a href="/faq" class="underline">FAQ</a>.
						</p>
					</div>
				</div>
			</Tabs.Content>

			<!-- Manual Setup Tab -->
			<Tabs.Content value="manual" class="space-y-6 mt-4">
				<!-- URL Input -->
				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="ngrokUrl">Server URL</Label>
						<Input
							id="ngrokUrl"
							bind:value={ngrokUrl}
							placeholder="https://your-tunnel-url.example.com"
						/>
						<p class="text-sm text-muted-foreground">
							Paste your tunnel URL here if you already have a server running
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
								<Label for="assistantName">Assistant Name</Label>
								<Input
									id="assistantName"
									bind:value={assistantName}
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
				</div>

				<!-- Manual Setup Commands -->
				<Accordion.Root type="single">
					<Accordion.Item value="manual-commands">
						<Accordion.Trigger
							>Need to start your server manually?</Accordion.Trigger
						>
						<Accordion.Content>
							<div class="space-y-6 pt-4">
								<p class="text-sm text-muted-foreground">
									Run these commands separately and paste the tunnel URL above
								</p>

								<!-- Start OpenCode -->
								<div class="space-y-2">
									<p class="text-sm font-medium">Start OpenCode server:</p>
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

								<!-- Create tunnel -->
								<div class="space-y-3">
									<p class="text-sm font-medium">Create tunnel:</p>

									<Accordion.Root type="single" class="w-full">
										<Accordion.Item value="cloudflared">
											<Accordion.Trigger class="text-sm"
												>Cloudflared</Accordion.Trigger
											>
											<Accordion.Content>
												<div class="space-y-2 pt-2">
													<div class="flex items-center gap-2">
														<code class="flex-1 bg-muted p-2 rounded text-sm">
															{cloudflaredCommand}
														</code>
														<Button
															size="icon"
															variant="ghost"
															onclick={() =>
																copyToClipboard(cloudflaredCommand)}
														>
															<Copy class="h-4 w-4" />
														</Button>
													</div>
													<p class="text-sm text-muted-foreground">
														Copy the generated URL from the output.
													</p>
												</div>
											</Accordion.Content>
										</Accordion.Item>

										<Accordion.Item value="ngrok">
											<Accordion.Trigger class="text-sm"
												>ngrok</Accordion.Trigger
											>
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
														Copy the HTTPS URL from the output.
													</p>
												</div>
											</Accordion.Content>
										</Accordion.Item>
									</Accordion.Root>
								</div>
							</div>
						</Accordion.Content>
					</Accordion.Item>
				</Accordion.Root>

				<!-- Advanced Settings -->
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
									Change if default port conflicts with other services.
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
									Pre-filled from settings. Changes only affect this assistant.
								</p>
							</div>
						</Accordion.Content>
					</Accordion.Item>
				</Accordion.Root>
			</Tabs.Content>
		</Tabs.Root>

		<Modal.Footer>
			<div class="flex items-center justify-end gap-2">
				<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
				<Button
					onclick={handleCreate}
					disabled={!testSuccess ||
						!assistantName.trim() ||
						createAssistantMutation.isPending}
				>
					{#if createAssistantMutation.isPending}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Creating...
					{:else}
						Create Assistant
					{/if}
				</Button>
			</div>
		</Modal.Footer>
	</Modal.Content>
</Modal.Root>

<script lang="ts">
	import { goto } from '$app/navigation';
	import MessageInput from './_components/messages/MessageInput.svelte';
	import MessageList from './_components/messages/MessageList.svelte';
	import ModeSelector from './_components/session-controls/ModeSelector.svelte';
	import ModelSelector from './_components/session-controls/ModelSelector.svelte';
	import * as rpc from '$lib/query';
	import { createMessageSubscriber } from '$lib/stores/messages.svelte';
	import { formatDate } from '$lib/utils/date';
	import * as AlertDialog from '@repo/ui/alert-dialog';
	import { Badge } from '@repo/ui/badge';
	import * as Breadcrumb from '@repo/ui/breadcrumb';
	import { Button } from '@repo/ui/button';
	import { Separator } from '@repo/ui/separator';
	import { createMutation } from '@tanstack/svelte-query';
		import { ChevronRight } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';
	import { buttonVariants } from '@repo/ui/button';

	let { data }: { data: PageData } = $props();
	const workspaceConfig = $derived(data.workspaceConfig);
	const session = $derived(data.session);
	const sessionId = $derived(session.id);

	const sendMessageMutation = createMutation(rpc.messages.sendMessage.options);
	const deleteSessionMutation = createMutation(rpc.sessions.deleteSession.options);
	const shareSessionMutation = createMutation(rpc.sessions.shareSession.options);
	const unshareSessionMutation = createMutation(rpc.sessions.unshareSession.options);
	const abortSessionMutation = createMutation(rpc.sessions.abortSession.options);

	// Create message subscriber
	const messages = createMessageSubscriber({
		workspace: () => workspaceConfig,
		sessionId: () => sessionId,
		initialMessages: () => data.messages ?? [],
	});
	let messageContent = $state('');
	let messageMode = $state(data.modes?.at(0)?.name ?? 'build');
	let selectedModel = $state<{ providerId: string; modelId: string } | null>({
		providerId: 'anthropic',
		modelId: 'claude-sonnet-4-20250514'
	});

	const isProcessing = $derived(
		messages.value.some((msg) => 
			msg.info.role === 'assistant' && !msg.info.time.completed
		),
	);

	const canSendMessage = $derived(
		messageContent.trim().length > 0 && !isProcessing && !sendMessageMutation.isPending && selectedModel !== null,
	);


	function handleSendMessage() {
		if (!canSendMessage || !selectedModel) return;

		const content = messageContent.trim();
		messageContent = '';

		sendMessageMutation.mutate({
			workspaceConfig,
			sessionId,
			body: {
				providerID: selectedModel.providerId,
				modelID: selectedModel.modelId,
				mode: messageMode,
				parts: [{ type: 'text', text: content }],
			},
		}, {
			onError: (error) => {
				toast.error(error.title, {
					description: error.description,
				});
				// Restore the message content on error
				messageContent = content;
			},
		});
	}

	async function handleFileUpload(_files: File[]) {
		// For now, just show a toast that file upload is not yet implemented
		toast.info('File upload coming soon!', {
			description: 'This feature is still being implemented.',
		});
	}

	function handleModeChange(mode: string) {
		messageMode = mode;
		toast.success(`Switched to ${mode} mode`);
	}
</script>

{#if session}
	<div class="flex flex-col h-[calc(100vh-3.5rem)] px-4 sm:px-6 py-4">
		<!-- Breadcrumb Navigation -->
		<Breadcrumb.Root class="mb-3 sm:mb-4">
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/workspaces" class="text-xs sm:text-sm">Workspaces</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator>
					<ChevronRight class="h-3 w-3 sm:h-4 sm:w-4" />
				</Breadcrumb.Separator>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/workspaces/{workspaceConfig.id}" class="text-xs sm:text-sm">
						{workspaceConfig.name}
					</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator>
					<ChevronRight class="h-3 w-3 sm:h-4 sm:w-4" />
				</Breadcrumb.Separator>
				<Breadcrumb.Item>
					<Breadcrumb.Page class="text-xs sm:text-sm">
						{session?.title || 'Untitled Session'}
					</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>

		{#if session}
			<div class="flex items-center justify-between pb-4 border-b">
				<div>
					<h1 class="text-2xl font-bold">
						{session.title ?? 'Untitled Session'}
					</h1>
					<div
						class="flex items-center gap-4 mt-1 text-sm text-muted-foreground"
					>
						<span >Created {formatDate(
								new Date(session.time.created),
							)}
							</span
						>
						<span>•</span>
						<span
							>Updated {formatDate(
								new Date(session.time.updated),
							)}</span
						>
					</div>
				</div>
				<div class="flex items-center gap-2">
					{#if session.share?.url}
						<Badge variant="secondary">Shared</Badge>
					{/if}
					{#if isProcessing}
						<Button size="sm" variant="destructive" onclick={() => {
							abortSessionMutation.mutate({ workspaceConfig, sessionId }, {
								onSuccess: () => {
									toast.success('Session aborted successfully');
								},
								onError: (error) => {
									toast.error(error.title, {
										description: error.description,
									});
								},
							});
						}}>
							Abort
						</Button>
					{/if}
					{#if session.share?.url}
						<Button size="sm" variant="outline" onclick={() => {
							unshareSessionMutation.mutate({ workspaceConfig, sessionId }, {
								onSuccess: () => {
									toast.success('Session unshared successfully');
								},
								onError: (error) => {
									toast.error(error.title, {
										description: error.description,
									});
								},
							});
						}}>
							Unshare
						</Button>
					{:else}
						<Button size="sm" variant="outline" onclick={() => {
							shareSessionMutation.mutate({ workspaceConfig, sessionId }, {
								onSuccess: () => {
									toast.success('Session shared successfully');
								},
								onError: (error) => {
									toast.error(error.title, {
										description: error.description,
									});
								},
							});
						}}>
							Share
						</Button>
					{/if}
					<AlertDialog.Root>
						<AlertDialog.Trigger class={buttonVariants({ size: 'sm', variant: 'destructive' })}>
							
								Delete
							
						</AlertDialog.Trigger>
						<AlertDialog.Content>
							<AlertDialog.Header>
								<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
								<AlertDialog.Description>
									This action cannot be undone. This will permanently delete the session
									"{session?.title ?? 'Untitled Session'}" and all its
									messages.
								</AlertDialog.Description>
							</AlertDialog.Header>
							<AlertDialog.Footer>
								<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
								<AlertDialog.Action onclick={() => {
									deleteSessionMutation.mutate({ workspaceConfig, sessionId }, {
										onSuccess: () => {
											toast.success('Session deleted successfully');
											goto(`/workspaces/${workspaceConfig.id}`);
										},
										onError: (error) => {
											toast.error(error.title, {
												description: error.description,
											});
										},
									});
								}}>Delete</AlertDialog.Action>
							</AlertDialog.Footer>
						</AlertDialog.Content>
					</AlertDialog.Root>
				</div>
			</div>
		{/if}

		<MessageList messages={messages.value} />

		<Separator />

		<div class="pt-4 space-y-2">
			<!-- Session Controls -->
			<div class="flex items-center gap-2">
				<ModeSelector
					{workspaceConfig}
					bind:value={messageMode}
					onModeChange={handleModeChange}
				/>
				<ModelSelector
					{workspaceConfig}
					bind:value={selectedModel}
				/>
			</div>
			
			<MessageInput
				bind:value={messageContent}
				onSubmit={handleSendMessage}
				onFileUpload={handleFileUpload}
				disabled={sendMessageMutation.isPending || !selectedModel}
				placeholder={isProcessing
					? 'Waiting for response...'
					: !selectedModel
					? 'Select a model to start chatting...'
					: 'Type your message...'}
			/>
		</div>
	</div>
{/if}

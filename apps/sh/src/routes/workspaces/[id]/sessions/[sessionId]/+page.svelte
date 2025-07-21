<script lang="ts">
	import { goto } from '$app/navigation';
	import MessageInput from '$lib/components/MessageInput.svelte';
	import MessageList from '$lib/components/MessageList.svelte';
	import ModeSelector from '$lib/components/ModeSelector.svelte';
	import ModelSelector from '$lib/components/ModelSelector.svelte';
	import * as rpc from '$lib/query';
	import { createMessageSubscriber } from '$lib/stores/messages.svelte';
	import * as AlertDialog from '@repo/ui/alert-dialog';
	import * as Breadcrumb from '@repo/ui/breadcrumb';
	import { Separator } from '@repo/ui/separator';
	import { createQuery } from '@tanstack/svelte-query';
	import { ChevronRight } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';
	import { createMutation } from '@tanstack/svelte-query';

	let { data }: { data: PageData } = $props();
	const workspaceConfig = $derived(data.workspaceConfig);
	const sessionId = $derived(data.sessionId);

	// Create session query with workspace accessor
	const sessionQuery = createQuery(
		rpc.sessions.getSessionById(
			() => workspaceConfig,
			() => sessionId,
		).options,
	);

	const sendMessageMutation = createMutation(
		rpc.messages.sendMessage.options,
	);

	const deleteSessionMutation = createMutation(() => ({
		...rpc.sessions.deleteSession.options(),
		onSuccess: () => {
			toast.success('Session deleted successfully');
			goto(`/workspaces/${workspaceConfig.id}`);
		},
		onError: (error) => {
			toast.error(error.title, {
				description: error.description,
			});
		},
	}));

	const shareSessionMutation = createMutation(() => ({
		...rpc.sessions.shareSession.options(),
		onSuccess: () => {
			toast.success('Session shared successfully');
		},
		onError: (error) => {
			toast.error(error.title, {
				description: error.description,
			});
		},
	}));

	const unshareSessionMutation = createMutation(() => ({
		...rpc.sessions.unshareSession.options(),
		onSuccess: () => {
			toast.success('Session unshared successfully');
		},
		onError: (error) => {
			toast.error(error.title, {
				description: error.description,
			});
		},
	}));

	const abortSessionMutation = createMutation(() => ({
		...rpc.sessions.abortSession.options(),
		onSuccess: () => {
			toast.success('Session aborted successfully');
		},
		onError: (error) => {
			toast.error(error.title, {
				description: error.description,
			});
		},
	}));

	// Create message subscriber
	const messages = createMessageSubscriber(
		() => workspaceConfig,
		() => sessionId,
	);

	// Load initial messages when component mounts
	$effect(() => {
		messages.loadInitialMessages();
	});

	let deleteDialogOpen = $state(false);
	let messageContent = $state('');
	let messageMode = $state('chat');
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

	function handleDelete() {
		if (!sessionQuery.data) return;

		deleteSessionMutation.mutate({
			workspaceConfig,
			sessionId,
		});
	}

	function handleShare() {
		shareSessionMutation.mutate({
			workspaceConfig,
			sessionId,
		});
	}

	function handleUnshare() {
		unshareSessionMutation.mutate({
			workspaceConfig,
			sessionId,
		});
	}

	function handleAbort() {
		abortSessionMutation.mutate({
			workspaceConfig,
			sessionId,
		});
	}

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

{#if sessionQuery}
	<div class="flex flex-col h-[calc(100vh-3.5rem)] w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
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
						{sessionQuery.data?.title || 'Untitled Session'}
					</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>

		{#if sessionQuery.data}
			<!-- <div class="flex items-center justify-between pb-4 border-b">
				<div>
					<h1 class="text-2xl font-bold">
						{sessionQuery.data.title || 'Untitled Session'}
					</h1>
					<div
						class="flex items-center gap-4 mt-1 text-sm text-muted-foreground"
					>
						<span
							>Created {formatDate(
								new Date(sessionQuery.data.time.created),
							)}</span
						>
						<span>•</span>
						<span
							>Updated {formatDate(
								new Date(sessionQuery.data.time.updated),
							)}</span
						>
					</div>
				</div>
				<div class="flex items-center gap-2">
					{#if sessionQuery.data.share?.url}
						<Badge variant="secondary">Shared</Badge>
					{/if}
					{#if isProcessing}
						<Button size="sm" variant="destructive" onclick={handleAbort}>
							Abort
						</Button>
					{/if}
					{#if sessionQuery.data.share?.url}
						<Button size="sm" variant="outline" onclick={handleUnshare}>
							Unshare
						</Button>
					{:else}
						<Button size="sm" variant="outline" onclick={handleShare}>
							Share
						</Button>
					{/if}
					<Button
						size="sm"
						variant="destructive"
						onclick={() => (deleteDialogOpen = true)}
					>
						Delete
					</Button>
				</div>
			</div> -->
		{/if}

		<div class="flex-1 overflow-y-auto">
			<MessageList
				messages={messages.value}
				isLoading={sessionQuery.isPending}
			/>
		</div>

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
					class="w-[200px]"
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

	<AlertDialog.Root bind:open={deleteDialogOpen}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
				<AlertDialog.Description>
					This action cannot be undone. This will permanently delete the session
					"{sessionQuery.data?.title ?? 'Untitled Session'}" and all its
					messages.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
				<AlertDialog.Action onclick={handleDelete}>Delete</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
{/if}

<script lang="ts">
	import { goto } from '$app/navigation';
	import { createQuery } from '@tanstack/svelte-query';
	import * as rpc from '$lib/query';
	import MessageList from '$lib/components/MessageList.svelte';
	import MessageInput from '$lib/components/MessageInput.svelte';
	import SessionControls from '$lib/components/SessionControls.svelte';
	import { createMessageSubscriber } from '$lib/stores/messages.svelte';
	import { Button } from '@repo/ui/button';
	import { Badge } from '@repo/ui/badge';
	import { Separator } from '@repo/ui/separator';
	import * as AlertDialog from '@repo/ui/alert-dialog';
	import * as Breadcrumb from '@repo/ui/breadcrumb';
	import { toast } from 'svelte-sonner';
	import { formatDate } from '$lib/utils/date';
	import { ChevronRight } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const workspace = $derived(data.workspace);
	const sessionId = $derived(data.sessionId);

	// Create session query with workspace accessor
	const sessionQuery = createQuery(
		rpc.sessions.getSessionById(
			() => workspace,
			() => sessionId,
		).options,
	);

	// Create message subscriber
	const messages = createMessageSubscriber(
		() => workspace,
		() => sessionId,
	);

	// Load initial messages when component mounts
	$effect(() => {
		messages.loadInitialMessages();
	});

	let deleteDialogOpen = $state(false);
	let messageContent = $state('');
	let messageMode = $state('chat');
	let isSending = $state(false);

	const isProcessing = $derived(
		rpc.messages.isSessionProcessing(messages.value),
	);

	const canSendMessage = $derived(
		messageContent.trim().length > 0 && !isProcessing && !isSending,
	);

	async function handleDelete() {
		if (!sessionQuery.data) return;

		const result = await rpc.sessions.deleteSession.execute({
			workspace,
			sessionId,
		});

		if (result.error) {
			toast.error(result.error.title, {
				description: result.error.description,
			});
		} else if (result.data) {
			toast.success('Session deleted successfully');
			goto(`/workspaces/${workspace.id}`);
		}
	}

	async function handleShare() {
		const result = await rpc.sessions.shareSession.execute({
			workspace,
			id: sessionId,
		});

		if (result.error) {
			toast.error(result.error.title, {
				description: result.error.description,
			});
		} else if (result.data) {
			toast.success('Session shared successfully');
		}
	}

	async function handleUnshare() {
		const result = await rpc.sessions.unshareSession.execute({
			workspace,
			id: sessionId,
		});

		if (result.error) {
			toast.error(result.error.title, {
				description: result.error.description,
			});
		} else if (result.data) {
			toast.success('Session unshared successfully');
		}
	}

	async function handleAbort() {
		const result = await rpc.sessions.abortSession.execute({
			workspace,
			id: sessionId,
		});

		if (result.error) {
			toast.error(result.error.title, {
				description: result.error.description,
			});
		} else if (result.data) {
			toast.success('Session aborted successfully');
		}
	}

	async function handleSendMessage() {
		if (!canSendMessage) return;

		const content = messageContent.trim();
		messageContent = '';

		isSending = true;
		const result = await rpc.messages.sendMessage.execute({
			workspace,
			sessionId,
			body: {
				providerID: 'openai',  // TODO: Get from workspace settings
				modelID: 'gpt-4o',      // TODO: Get from workspace settings
				mode: messageMode,
				parts: [{ type: 'text', text: content }],
			},
		});

		if (result.error) {
			toast.error(result.error.title, {
				description: result.error.description,
			});
			// Restore the message content on error
			messageContent = content;
		}

		isSending = false;
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
	<div class="container mx-auto py-6 flex flex-col h-[calc(100vh-5rem)]">
		<!-- Breadcrumb Navigation -->
		<Breadcrumb.Root class="mb-4">
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/workspaces">Workspaces</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator>
					<ChevronRight class="h-4 w-4" />
				</Breadcrumb.Separator>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/workspaces/{workspace.id}">
						{workspace.name}
					</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator>
					<ChevronRight class="h-4 w-4" />
				</Breadcrumb.Separator>
				<Breadcrumb.Item>
					<Breadcrumb.Page>
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

		<!-- Session Controls -->
		<SessionControls
			currentMode={messageMode}
			onModeChange={handleModeChange}
			isProcessing={isProcessing}
		/>

		<div class="flex-1 overflow-y-auto">
			<MessageList
				messages={messages.value}
				isLoading={sessionQuery.isPending}
			/>
		</div>

		<Separator />

		<div class="pt-4">
			<MessageInput
				bind:value={messageContent}
				bind:mode={messageMode}
				onSubmit={handleSendMessage}
				onFileUpload={handleFileUpload}
				disabled={!canSendMessage}
				placeholder={isProcessing
					? 'Waiting for response...'
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

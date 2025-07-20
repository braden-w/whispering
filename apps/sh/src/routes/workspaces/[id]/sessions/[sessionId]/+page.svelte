<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getWorkspace } from '$lib/stores/workspaces.svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import * as rpc from '$lib/query';
	import MessageList from '$lib/components/MessageList.svelte';
	import MessageInput from '$lib/components/MessageInput.svelte';
	import { createMessageSubscriber } from '$lib/stores/messages.svelte';
	import { Button } from '@repo/ui/button';
	import { Badge } from '@repo/ui/badge';
	import { Separator } from '@repo/ui/separator';
	import * as AlertDialog from '@repo/ui/alert-dialog';
	import * as Breadcrumb from '@repo/ui/breadcrumb';
	import { toast } from 'svelte-sonner';
	import { formatDate } from '$lib/utils/date';
	import { ChevronRight } from 'lucide-svelte';

	const workspaceId = $derived($page.params.id);
	const sessionId = $derived($page.params.sessionId);
	const workspace = $derived(getWorkspace(workspaceId));

	// Redirect if workspace not found
	$effect(() => {
		if (!workspace) {
			goto('/workspaces');
		}
	});

	// Create session query with workspace accessor
	const sessionQuery = $derived(
		workspace
			? createQuery(
					rpc.sessions.getSessionById(
						() => workspace,
						() => sessionId,
					).options,
				)
			: null,
	);

	// Create message subscriber
	const messages = $derived(
		workspace
			? createMessageSubscriber(
					() => workspace,
					() => sessionId,
				)
			: null,
	);

	// Load initial messages when component mounts
	$effect(() => {
		if (messages) {
			messages.loadInitialMessages();
		}
	});

	let deleteDialogOpen = $state(false);
	let messageContent = $state('');
	let messageMode = $state('chat');
	let isSending = $state(false);

	const isProcessing = $derived(
		messages?.value ? rpc.messages.isSessionProcessing(messages.value) : false,
	);

	const canSendMessage = $derived(
		messageContent.trim().length > 0 && !isProcessing && !isSending,
	);

	async function handleDelete() {
		if (!workspace || !sessionQuery?.data) return;

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
		if (!workspace) return;

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
		if (!workspace) return;

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
		if (!workspace) return;

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
		if (!canSendMessage || !workspace) return;

		const content = messageContent.trim();
		messageContent = '';

		isSending = true;
		const result = await rpc.messages.sendMessage.execute({
			workspace,
			sessionId,
			mode: messageMode,
			parts: [{ type: 'text', text: content }],
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

	async function handleFileUpload(files: File[]) {
		if (!workspace) return;

		// For now, just show a toast that file upload is not yet implemented
		toast.info('File upload coming soon!', {
			description: 'This feature is still being implemented.',
		});
	}
</script>

{#if workspace && sessionQuery}
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
					<Breadcrumb.Link href="/workspaces/{workspaceId}">
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
			<div class="flex items-center justify-between pb-4 border-b">
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
			</div>
		{/if}

		<div class="flex-1 overflow-hidden">
			{#if messages}
				<MessageList
					messages={messages.value}
					isLoading={sessionQuery.isPending}
				/>
			{/if}
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
					"{sessionQuery?.data?.title || 'Untitled Session'}" and all its
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

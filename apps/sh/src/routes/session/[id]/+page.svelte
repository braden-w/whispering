<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import * as rpc from '$lib/query';
	import MessageList from '$lib/components/MessageList.svelte';
	import MessageInput from '$lib/components/MessageInput.svelte';
	import { Button } from '@repo/ui/button';
	import { Badge } from '@repo/ui/badge';
	import { Separator } from '@repo/ui/separator';
	import * as AlertDialog from '@repo/ui/alert-dialog';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { formatDate } from '$lib/utils/date';

	let { data } = $props<{ sessionId: string }>();

	const sessionQuery = createQuery(
		rpc.sessions.getSessionById(data.sessionId).options,
	);
	const messagesQuery = createQuery(
		rpc.messages.getMessagesBySessionId(data.sessionId).options,
	);

	let deleteDialogOpen = $state(false);
	let messageContent = $state('');

	let isSending = $state(false);

	const isProcessing = $derived(
		messagesQuery.data
			? rpc.messages.isSessionProcessing(messagesQuery.data)
			: false,
	);

	const canSendMessage = $derived(
		messageContent.trim().length > 0 && !isProcessing && !isSending,
	);

	async function handleDelete() {
		const result = await rpc.sessions.deleteSession.execute({
			id: data.sessionId,
		});

		const { data, error } = result;
		if (error) {
			toast.error(error.title, {
				description: error.description,
			});
			console.error('Error deleting session:', error);
		} else if (data) {
			toast.success('Session deleted successfully');
			goto('/');
		}
	}

	async function handleShare() {
		const result = await rpc.sessions.shareSession.execute({
			id: data.sessionId,
		});

		const { data, error } = result;
		if (error) {
			toast.error(error.title, {
				description: error.description,
			});
			console.error('Error sharing session:', error);
		} else if (data) {
			toast.success('Session shared successfully');
		}
	}

	async function handleUnshare() {
		const result = await rpc.sessions.unshareSession.execute({
			id: data.sessionId,
		});

		const { data, error } = result;
		if (error) {
			toast.error(error.title, {
				description: error.description,
			});
			console.error('Error unsharing session:', error);
		} else if (data) {
			toast.success('Session unshared successfully');
		}
	}

	async function handleAbort() {
		const result = await rpc.sessions.abortSession.execute({
			id: data.sessionId,
		});

		const { data, error } = result;
		if (error) {
			toast.error(error.title, {
				description: error.description,
			});
			console.error('Error aborting session:', error);
		} else if (data) {
			toast.success('Session aborted successfully');
		}
	}

	async function handleSendMessage() {
		if (!canSendMessage) return;

		const content = messageContent.trim();
		messageContent = '';

		isSending = true;
		const result = await rpc.messages.sendMessage.execute({
			sessionId: data.sessionId,
			parts: [{ type: 'text', text: content }],
		});

		const { data, error } = result;
		if (error) {
			toast.error(error.title, {
				description: error.description,
			});
			console.error('Error sending message:', error);
			// Restore the message content on error
			messageContent = content;
		}

		isSending = false;
	}
</script>

<div class="flex flex-col h-[calc(100vh-8rem)]">
	{#if sessionQuery.data}
		<div class="flex items-center justify-between pb-4 border-b">
			<div>
				<h1 class="text-2xl font-bold">
					{sessionQuery.data.title || 'Untitled Session'}
				</h1>
				<div class="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
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
		<MessageList
			messages={messagesQuery.data || []}
			isLoading={messagesQuery.isLoading}
		/>
	</div>

	<Separator />

	<div class="pt-4">
		<MessageInput
			bind:value={messageContent}
			onSubmit={handleSendMessage}
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
				This action cannot be undone. This will permanently delete the session "{sessionQuery
					.data?.title || 'Untitled Session'}" and all its messages.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={handleDelete}>Delete</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

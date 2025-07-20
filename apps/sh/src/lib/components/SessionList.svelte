<script lang="ts">
	import type { Session } from '$lib/client/types.gen';
	import SessionCard from './SessionCard.svelte';
	import { Skeleton } from '@repo/ui/skeleton';
	import * as AlertDialog from '@repo/ui/alert-dialog';
	import * as rpc from '$lib/query';
	import { toast } from 'svelte-sonner';
	import { createQuery } from '@tanstack/svelte-query';

	let deleteDialogOpen = $state(false);
	let sessionToDelete = $state<Session | null>(null);

	const sessionsQuery = createQuery(rpc.sessions.getSessions.options);

	function handleDelete(session: Session) {
		sessionToDelete = session;
		deleteDialogOpen = true;
	}

	async function confirmDelete() {
		if (!sessionToDelete) return;

		const result = await rpc.sessions.deleteSession.execute({ id: sessionToDelete.id });
		
		if (result.isErr()) {
			toast.error(result.error.title, {
				description: result.error.description
			});
			console.error('Error deleting session:', result.error);
		} else {
			toast.success('Session deleted successfully');
		}
		
		deleteDialogOpen = false;
		sessionToDelete = null;
	}

	async function handleShare(session: Session) {
		const result = await rpc.sessions.shareSession.execute({ id: session.id });
		
		if (result.isErr()) {
			toast.error(result.error.title, {
				description: result.error.description
			});
			console.error('Error sharing session:', result.error);
		} else {
			toast.success('Session shared successfully');
		}
	}

	async function handleUnshare(session: Session) {
		const result = await rpc.sessions.unshareSession.execute({ id: session.id });
		
		if (result.isErr()) {
			toast.error(result.error.title, {
				description: result.error.description
			});
			console.error('Error unsharing session:', result.error);
		} else {
			toast.success('Session unshared successfully');
		}
	}
</script>

{#if sessionsQuery.isPending}
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each Array(6) as _}
			<div class="space-y-3">
				<Skeleton class="h-[125px] w-full rounded-xl" />
			</div>
		{/each}
	</div>
{:else if sessionsQuery.data?.length === 0}
	<div class="flex flex-col items-center justify-center py-12 text-center">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-12 w-12 text-muted-foreground mb-4"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
			/>
		</svg>
		<h3 class="text-lg font-semibold">No sessions yet</h3>
		<p class="text-sm text-muted-foreground mt-1">
			Create your first session to get started
		</p>
	</div>
{:else}
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each sessionsQuery.data as session}
			<SessionCard
				{session}
				onDelete={() => handleDelete(session)}
				onShare={() => handleShare(session)}
				onUnshare={() => handleUnshare(session)}
			/>
		{/each}
	</div>
{/if}

<AlertDialog.Root bind:open={deleteDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This action cannot be undone. This will permanently delete the session
				"{sessionToDelete?.title || 'Untitled Session'}" and all its messages.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmDelete}>
				Delete
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
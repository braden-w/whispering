<script lang="ts">
	import type { Session } from '$lib/client/types.gen';
	import * as Card from '@repo/ui/card';
	import { Button, buttonVariants } from '@repo/ui/button';
	import { Badge } from '@repo/ui/badge';
	import { formatDistanceToNow } from '$lib/utils/date';
	import { toast } from 'svelte-sonner';
	import * as rpc from '$lib/query';
	import * as AlertDialog from '@repo/ui/alert-dialog';
	import { createMutation } from '@tanstack/svelte-query';

	let { session }: { session: Session } = $props();
	let deleteDialogOpen = $state(false);

	const shareSessionMutation = createMutation(
		rpc.sessions.shareSession.options,
	);
	const unshareSessionMutation = createMutation(
		rpc.sessions.unshareSession.options,
	);
	const deleteSessionMutation = createMutation(
		rpc.sessions.deleteSession.options,
	);

	const createdAt = $derived(new Date(session.time.created));
	const updatedAt = $derived(new Date(session.time.updated));
	const isShared = $derived(!!session.share?.url);
</script>

<Card.Root class="hover:shadow-md transition-shadow cursor-pointer">
	<a href="/session/{session.id}" class="block">
		<Card.Header>
			<div class="flex items-start justify-between">
				<div class="space-y-1">
					<Card.Title class="text-lg">
						{session.title || 'Untitled Session'}
					</Card.Title>
					<Card.Description>
						Created {formatDistanceToNow(createdAt)} ago
					</Card.Description>
				</div>
				{#if isShared}
					<Badge variant="secondary">Shared</Badge>
				{/if}
			</div>
		</Card.Header>
		<Card.Content>
			<div class="text-sm text-muted-foreground">
				Last updated {formatDistanceToNow(updatedAt)} ago
			</div>
		</Card.Content>
	</a>
	<Card.Footer class="flex justify-between">
		<div class="flex gap-2">
			{#if isShared}
				<Button
					size="sm"
					variant="outline"
					onclick={(e) => {
						e.preventDefault();
						unshareSessionMutation.mutate(
							{ id: session.id },
							{
								onSuccess: () => {
									toast.success('Session unshared successfully');
								},
								onError: (error) => {
									toast.error(error.title, {
										description: error.description,
									});
								},
							},
						);
					}}
				>
					Unshare
				</Button>
			{:else}
				<Button
					size="sm"
					variant="outline"
					onclick={(e) => {
						e.preventDefault();
						shareSessionMutation.mutate(
							{ id: session.id },
							{
								onSuccess: () => {
									toast.success('Session shared successfully');
								},
								onError: (error) => {
									toast.error(error.title, {
										description: error.description,
									});
								},
							},
						);
					}}
				>
					Share
				</Button>
			{/if}
		</div>
		<AlertDialog.Root bind:open={deleteDialogOpen}>
			<AlertDialog.Trigger
				class={buttonVariants({ size: 'sm', variant: 'destructive' })}
			>
				<Button size="sm" variant="destructive">Delete</Button>
			</AlertDialog.Trigger>
			<AlertDialog.Content>
				<AlertDialog.Header>
					<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
					<AlertDialog.Description>
						This action cannot be undone. This will permanently delete the
						session "{session.title || 'Untitled Session'}" and all its
						messages.
					</AlertDialog.Description>
				</AlertDialog.Header>
				<AlertDialog.Footer>
					<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
					<AlertDialog.Action
						onclick={() =>
							deleteSessionMutation.mutate(
								{ id: session.id },
								{
									onSuccess: () => {
										toast.success('Session deleted successfully');
									},
									onError: (error) => {
										toast.error(error.title, {
											description: error.description,
										});
									},
								},
							)}
					>
						Delete
					</AlertDialog.Action>
				</AlertDialog.Footer>
			</AlertDialog.Content>
		</AlertDialog.Root>
	</Card.Footer>
</Card.Root>

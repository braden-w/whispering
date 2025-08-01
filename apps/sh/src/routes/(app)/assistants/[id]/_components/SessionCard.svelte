<script lang="ts">
	import type { Session } from '$lib/client/types.gen';
	import type { AssistantConfig } from '$lib/stores/assistant-configs.svelte';

	import * as rpc from '$lib/query';
	import { formatDistanceToNow } from '$lib/utils/date';
	import * as AlertDialog from '@repo/ui/alert-dialog';
	import { Badge } from '@repo/ui/badge';
	import { Button, buttonVariants } from '@repo/ui/button';
	import * as Card from '@repo/ui/card';
	import { createMutation } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';

	let {
		assistantConfig,
		session,
	}: { assistantConfig: AssistantConfig; session: Session } = $props();
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
	<a
		href={assistantConfig
			? `/assistants/${assistantConfig.id}/sessions/${session.id}`
			: `/session/${session.id}`}
		class="block"
	>
		<Card.Header class="flex items-start justify-between">
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
					onclick={() => {
						unshareSessionMutation.mutate(
							{ assistantConfig, sessionId: session.id },
							{
								onError: (error) => {
									toast.error(error.title, {
										description: error.description,
									});
								},
								onSuccess: () => {
									toast.success('Session unshared successfully');
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
					onclick={() => {
						shareSessionMutation.mutate(
							{ assistantConfig, sessionId: session.id },
							{
								onError: (error) => {
									toast.error(error.title, {
										description: error.description,
									});
								},
								onSuccess: () => {
									toast.success('Session shared successfully');
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
			<AlertDialog.Trigger>
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
								{ assistantConfig, sessionId: session.id },
								{
									onError: (error) => {
										toast.error(error.title, {
											description: error.description,
										});
									},
									onSuccess: () => {
										toast.success('Session deleted successfully');
										deleteDialogOpen = false;
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

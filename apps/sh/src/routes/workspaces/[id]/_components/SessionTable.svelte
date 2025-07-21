<script lang="ts">
	import type { Session } from '$lib/client/types.gen';
	import type { WorkspaceConfig } from '$lib/stores/workspace-configs.svelte';
	import * as Table from '@repo/ui/table';
	import { Button } from '@repo/ui/button';
	import { Badge } from '@repo/ui/badge';
	import { formatDistanceToNow } from '$lib/utils/date';
	import { toast } from 'svelte-sonner';
	import * as rpc from '$lib/query';
	import * as AlertDialog from '@repo/ui/alert-dialog';
	import { createMutation } from '@tanstack/svelte-query';

	let {
		sessions,
		workspaceConfig,
	}: {
		sessions: Session[];
		workspaceConfig: WorkspaceConfig;
	} = $props();

	const shareSessionMutation = createMutation(rpc.sessions.shareSession.options);
	const unshareSessionMutation = createMutation(rpc.sessions.unshareSession.options);
	const deleteSessionMutation = createMutation(rpc.sessions.deleteSession.options);

	let deleteDialogStates = $state<Record<string, boolean>>({});

	function getDeleteDialogState(sessionId: string) {
		return deleteDialogStates[sessionId] ?? false;
	}

	function setDeleteDialogState(sessionId: string, open: boolean) {
		deleteDialogStates[sessionId] = open;
	}

	function getSessionHref(session: Session) {
		return workspaceConfig
			? `/workspaces/${workspaceConfig.id}/sessions/${session.id}`
			: `/session/${session.id}`;
	}

	function isShared(session: Session) {
		return !!session.share?.url;
	}

	function handleShare(session: Session) {
		shareSessionMutation.mutate(
			{ workspaceConfig, sessionId: session.id },
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
	}

	function handleUnshare(session: Session) {
		unshareSessionMutation.mutate(
			{ workspaceConfig, sessionId: session.id },
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
	}

	function handleDelete(session: Session) {
		deleteSessionMutation.mutate(
			{ workspaceConfig, sessionId: session.id },
			{
				onSuccess: () => {
					toast.success('Session deleted successfully');
					setDeleteDialogState(session.id, false);
				},
				onError: (error) => {
					toast.error(error.title, {
						description: error.description,
					});
				},
			},
		);
	}
</script>

<div class="rounded-md border">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Title</Table.Head>
				<Table.Head>Created</Table.Head>
				<Table.Head>Updated</Table.Head>
				<Table.Head>Status</Table.Head>
				<Table.Head class="text-right">Actions</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each sessions as session}
				{@const createdAt = new Date(session.time.created)}
				{@const updatedAt = new Date(session.time.updated)}
				{@const shared = isShared(session)}
				<Table.Row class="hover:bg-muted/50">
					<Table.Cell class="font-medium">
						<a
							href={getSessionHref(session)}
							class="hover:underline text-foreground"
						>
							{session.title || 'Untitled Session'}
						</a>
					</Table.Cell>
					<Table.Cell class="text-muted-foreground">
						{formatDistanceToNow(createdAt)} ago
					</Table.Cell>
					<Table.Cell class="text-muted-foreground">
						{formatDistanceToNow(updatedAt)} ago
					</Table.Cell>
					<Table.Cell>
						{#if shared}
							<Badge variant="secondary">Shared</Badge>
						{:else}
							<span class="text-muted-foreground">—</span>
						{/if}
					</Table.Cell>
					<Table.Cell>
						<div class="flex items-center justify-end gap-2">
							{#if shared}
								<Button
									size="sm"
									variant="outline"
									onclick={() => handleUnshare(session)}
									disabled={unshareSessionMutation.isPending}
								>
									{#if unshareSessionMutation.isPending}
										Unsharing...
									{:else}
										Unshare
									{/if}
								</Button>
							{:else}
								<Button
									size="sm"
									variant="outline"
									onclick={() => handleShare(session)}
									disabled={shareSessionMutation.isPending}
								>
									{#if shareSessionMutation.isPending}
										Sharing...
									{:else}
										Share
									{/if}
								</Button>
							{/if}

							<AlertDialog.Root 
								open={getDeleteDialogState(session.id)}
								onOpenChange={(open) => setDeleteDialogState(session.id, open)}
							>
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
											onclick={() => handleDelete(session)}
											disabled={deleteSessionMutation.isPending}
										>
											{#if deleteSessionMutation.isPending}
												Deleting...
											{:else}
												Delete
											{/if}
										</AlertDialog.Action>
									</AlertDialog.Footer>
								</AlertDialog.Content>
							</AlertDialog.Root>
						</div>
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
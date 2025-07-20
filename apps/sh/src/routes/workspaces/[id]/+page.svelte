<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getWorkspace } from '$lib/stores/workspaces.svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import * as rpc from '$lib/query';
	import SessionList from '$lib/components/SessionList.svelte';
	import CreateSessionDialog from '$lib/components/CreateSessionDialog.svelte';
	import { Button } from '@repo/ui/button';
	import { Badge } from '@repo/ui/badge';
	import * as Breadcrumb from '@repo/ui/breadcrumb';
	import { ChevronRight } from 'lucide-svelte';
	import WorkspaceConnectionBadge from '$lib/components/WorkspaceConnectionBadge.svelte';

	const workspaceId = $derived($page.params.id);
	const workspace = $derived(getWorkspace(workspaceId));

	// Redirect if workspace not found
	$effect(() => {
		if (!workspace) {
			goto('/workspaces');
		}
	});

	// Create sessions query with workspace accessor
	const sessionsQuery = $derived(
		workspace
			? createQuery(rpc.sessions.getSessions(() => workspace).options)
			: null
	);

	let createDialogOpen = $state(false);
</script>

{#if workspace}
	<div class="container mx-auto py-6">
		<!-- Breadcrumb Navigation -->
		<Breadcrumb.Root class="mb-6">
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/workspaces">Workspaces</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator>
					<ChevronRight class="h-4 w-4" />
				</Breadcrumb.Separator>
				<Breadcrumb.Item>
					<Breadcrumb.Page>{workspace.name}</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>

		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold tracking-tight">{workspace.name}</h1>
					<p class="text-muted-foreground">
						Manage sessions for this workspace
					</p>
				</div>
				<div class="flex items-center gap-4">
					<WorkspaceConnectionBadge {workspace} />
					{#if sessionsQuery && sessionsQuery.data}
						<Badge variant="secondary" class="text-sm">
							{sessionsQuery.data.length} session{sessionsQuery.data.length !== 1
								? 's'
								: ''}
						</Badge>
					{/if}
					<Button onclick={() => (createDialogOpen = true)}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="mr-2"
						>
							<path d="M12 5v14M5 12h14" />
						</svg>
						Create New Session
					</Button>
				</div>
			</div>

			{#if sessionsQuery}
				<SessionList
					sessions={sessionsQuery.data || []}
					isLoading={sessionsQuery.isPending}
					workspaceId={workspace.id}
				/>
			{/if}
		</div>
	</div>

	{#if workspace}
		<CreateSessionDialog 
			bind:open={createDialogOpen} 
			{workspace}
		/>
	{/if}
{/if}
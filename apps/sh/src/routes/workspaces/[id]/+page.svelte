<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getWorkspaceConfig } from '$lib/stores/workspace-configs.svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import * as rpc from '$lib/query';
	import SessionList from '$lib/components/SessionList.svelte';
	import CreateSessionModal from '$lib/components/CreateSessionModal.svelte';
	import { Button } from '@repo/ui/button';
	import { Badge } from '@repo/ui/badge';
	import * as Breadcrumb from '@repo/ui/breadcrumb';
	import { ChevronRight } from 'lucide-svelte';
	import WorkspaceConnectionBadge from '$lib/components/WorkspaceConnectionBadge.svelte';

	const workspaceId = $derived($page.params.id);
	const workspaceConfig = $derived(getWorkspaceConfig(workspaceId));

	// Redirect if workspace not found
	$effect(() => {
		if (!workspaceConfig) {
			goto('/workspaces');
		}
	});

	// Create sessions query with workspace accessor
	const sessionsQuery = $derived(
		workspaceConfig
			? createQuery(rpc.sessions.getSessions(() => workspaceConfig).options)
			: null,
	);

	let createDialogOpen = $state(false);
</script>

{#if workspaceConfig}
	<!-- Breadcrumb Section -->
	<div class="border-b">
		<div
			class="container flex h-14 max-w-screen-2xl items-center px-4 sm:px-6 lg:px-8"
		>
			<Breadcrumb.Root>
				<Breadcrumb.List>
					<Breadcrumb.Item>
						<Breadcrumb.Link href="/workspaces">Workspaces</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator>
						<ChevronRight class="h-4 w-4" />
					</Breadcrumb.Separator>
					<Breadcrumb.Item>
						<Breadcrumb.Page>{workspaceConfig.name}</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</div>
	</div>

	<!-- Page Content -->
	<div class="container max-w-screen-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold tracking-tight">{workspaceConfig.name}</h1>
					<p class="text-muted-foreground">
						Manage sessions for this workspace
					</p>
				</div>
				<div class="flex items-center gap-4">
					<WorkspaceConnectionBadge workspaceConfig={workspaceConfig} />
					{#if sessionsQuery && sessionsQuery.data}
						<Badge variant="secondary" class="text-sm">
							{sessionsQuery.data.length} session{sessionsQuery.data.length !==
							1
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
					workspaceConfig={workspaceConfig}
				/>
			{/if}
		</div>
	</div>

	{#if workspaceConfig}
		<CreateSessionModal bind:open={createDialogOpen} {workspaceConfig} />
	{/if}
{/if}

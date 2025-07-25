<script lang="ts">
	import type { WorkspaceConfig } from '$lib/stores/workspace-configs.svelte';
	
	import WorkspaceConnectionBadge from './WorkspaceConnectionBadge.svelte';
	import DeleteWorkspaceConfigButton from './DeleteWorkspaceConfigButton.svelte';
	import EditWorkspaceConfigButton from './EditWorkspaceConfigButton.svelte';
	import * as rpc from '$lib/query';
	import { workspaceConfigs } from '$lib/stores/workspace-configs.svelte';
	import { formatDistanceToNow } from '$lib/utils/date';
	import { Badge } from '@repo/ui/badge';
	import { Button } from '@repo/ui/button';
	import * as Table from '@repo/ui/table';
	import * as Tooltip from '@repo/ui/tooltip';
	import { badgeVariants } from '@repo/ui/badge';
	import { createQuery } from '@tanstack/svelte-query';
	import { GitBranch } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let {
		config,
		columnVisibility,
	}: {
		config: WorkspaceConfig;
		columnVisibility: Record<string, boolean>;
	} = $props();

	const workspaceQuery = createQuery(() => ({
		...rpc.workspaces.getWorkspace(() => config).options(),
		refetchInterval: 5000, // Refresh every 5 seconds
	}));

	function handleConnect() {
		// Update last used timestamp
		workspaceConfigs.update(config.id, {});

		// Navigate to workspace sessions
		goto(`/workspaces/${config.id}`);
	}

	const workspace = $derived(workspaceQuery.data);
</script>

<Table.Row>
	{#if columnVisibility.name !== false}
		<Table.Cell class="font-medium">
			<div class="flex items-center gap-2">
				<Button
					variant="link"
					class="p-0"
					onclick={handleConnect}
					disabled={workspaceQuery.isPending}
				>
					{config.name}
				</Button>
				{#if workspace?.connected && workspace.appInfo.git}
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger class={badgeVariants({ variant: 'secondary' })}>
								<GitBranch class="size-4" />
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Git repository detected</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
				{/if}
			</div>
		</Table.Cell>
	{/if}
	{#if columnVisibility.port !== false}
		<Table.Cell>
			<Badge variant="secondary" class="text-xs font-mono">
				{config.port}
			</Badge>
		</Table.Cell>
	{/if}
	{#if columnVisibility.url !== false}
		<Table.Cell class="max-w-[200px] truncate">
			<code class="text-xs">{config.url}</code>
		</Table.Cell>
	{/if}
	{#if columnVisibility.rootPath !== false}
		<Table.Cell
			class="max-w-[200px] truncate"
			title={workspace?.connected
				? workspace.appInfo.path.root
				: ''}
		>
			{#if workspace?.connected}
				<code class="text-xs">{workspace.appInfo.path.root}</code>
			{:else}
				<span class="text-muted-foreground">—</span>
			{/if}
		</Table.Cell>
	{/if}
	{#if columnVisibility.cwd !== false}
		<Table.Cell
			class="max-w-[200px] truncate"
			title={workspace?.connected ? workspace.appInfo.path.cwd : ''}
		>
			{#if workspace?.connected}
				<code class="text-xs">{workspace.appInfo.path.cwd}</code>
			{:else}
				<span class="text-muted-foreground">—</span>
			{/if}
		</Table.Cell>
	{/if}
	{#if columnVisibility.status !== false}
		<Table.Cell>
			<WorkspaceConnectionBadge workspaceConfig={config} />
		</Table.Cell>
	{/if}
	{#if columnVisibility.lastUsed !== false}
		<Table.Cell>
			{formatDistanceToNow(new Date(config.lastAccessedAt))} ago
		</Table.Cell>
	{/if}
	{#if columnVisibility.actions !== false}
		<Table.Cell>
			<div class="flex items-center justify-end gap-2">
				<Button
					size="sm"
					variant="default"
					onclick={handleConnect}
					disabled={workspaceQuery.isPending || !workspace?.connected}
				>
					{workspace?.connected ? 'Open' : 'Connect'}
				</Button>
				<EditWorkspaceConfigButton workspaceConfig={config} disabled={workspaceQuery.isPending} />
				<DeleteWorkspaceConfigButton workspaceConfig={config} disabled={workspaceQuery.isPending} />
			</div>
		</Table.Cell>
	{/if}
</Table.Row>
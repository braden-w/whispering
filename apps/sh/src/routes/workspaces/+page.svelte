<script lang="ts">
	import type { WorkspaceConfig } from '$lib/stores/workspace-configs.svelte';

	import { goto } from '$app/navigation';
	import CreateWorkspaceConfigModal from '$lib/components/CreateWorkspaceConfigModal.svelte';
	import DeleteWorkspaceConfigButton from '$lib/components/DeleteWorkspaceConfigButton.svelte';
	import EditWorkspaceConfigButton from '$lib/components/EditWorkspaceConfigButton.svelte';
	import WorkspaceConnectionBadge from '$lib/components/WorkspaceConnectionBadge.svelte';
	import * as rpc from '$lib/query';
	import { workspaceConfigs } from '$lib/stores/workspace-configs.svelte';
	import { formatDistanceToNow } from '$lib/utils/date';
	import { Badge } from '@repo/ui/badge';
	import { Button, buttonVariants } from '@repo/ui/button';
	import * as DropdownMenu from '@repo/ui/dropdown-menu';
	import * as Table from '@repo/ui/table';
	import * as Tooltip from '@repo/ui/tooltip';
	import { cn } from '@repo/ui/utils';
	import { createQuery } from '@tanstack/svelte-query';
	import { ChevronDown, GitBranch, Plus } from 'lucide-svelte';

	// Helper function to extract folder name from path (cross-platform)
	function getFolderName(path: string): string {
		// Split by both forward and back slashes, filter out empty strings
		const segments = path.split(/[/\\]/).filter(Boolean);
		return segments[segments.length - 1] || 'workspace';
	}

	// Define available columns
	const columns = [
		{ hideable: false, id: 'folderName', label: '' }, // Empty label for folder name
		{ hideable: false, id: 'gitPort', label: '' }, // Empty label for Git/Port info
		{ hideable: true, id: 'url', label: 'URL' },
		{ hideable: true, id: 'rootPath', label: 'Root Path' },
		{ hideable: true, id: 'cwd', label: 'CWD' },
		{ hideable: false, id: 'status', label: 'Status' },
		{ hideable: true, id: 'lastUsed', label: 'Last Used' },
		{ hideable: false, id: 'actions', label: 'Actions' },
	];

	// Persisted column visibility state
	let columnVisibility = $state({
		actions: true,
		cwd: false, // Hidden by default
		folderName: true,
		gitPort: true,
		lastUsed: true,
		rootPath: false, // Hidden by default
		status: true,
		url: true,
	});

	const workspacesQuery = createQuery(() => ({
		...rpc.workspaces.getWorkspaces().options(),
		refetchInterval: 5000, // Refresh every 5 seconds
	}));

	// Helper to find workspace data by id
	function getWorkspaceData(configId: string) {
		return workspacesQuery.data?.find((w) => w.id === configId);
	}

	function handleConnect(workspace: WorkspaceConfig) {
		// Update last used timestamp
		workspaceConfigs.value = workspaceConfigs.value.map((w) =>
			w.id === workspace.id ? { ...w, lastAccessedAt: Date.now() } : w,
		);

		// Navigate to workspace sessions
		goto(`/workspaces/${workspace.id}`);
	}
</script>

<div class="px-4 sm:px-6 py-6 sm:py-8">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Workspaces</h1>
			<p class="text-muted-foreground mt-1">
				Manage your OpenCode server connections
			</p>
		</div>
		<div class="flex items-center gap-2">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					class={cn(
						buttonVariants({ variant: 'outline' }),
						'items-center transition-all [&[data-state=open]>svg]:rotate-180',
					)}
				>
					Columns <ChevronDown
						class="ml-2 h-4 w-4 transition-transform duration-200"
					/>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					{#each columns.filter((c) => c.hideable) as column}
						<DropdownMenu.CheckboxItem
							checked={columnVisibility[
								column.id as keyof typeof columnVisibility
							] ?? true}
							onCheckedChange={(checked) => {
								columnVisibility = {
									...columnVisibility,
									[column.id]: checked,
								};
							}}
						>
							{column.label}
						</DropdownMenu.CheckboxItem>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<CreateWorkspaceConfigModal>
				{#snippet triggerChild({ props })}
					<Button {...props}><Plus class="mr-2 h-4 w-4" /> Add Workspace</Button
					>
				{/snippet}
			</CreateWorkspaceConfigModal>
		</div>
	</div>

	{#if workspaceConfigs.value.length === 0}
		<div class="rounded-lg border border-dashed p-8 text-center">
			<h3 class="text-lg font-semibold">No workspaces yet</h3>
			<p class="text-muted-foreground mt-2">
				Create your first workspace to connect to an OpenCode server
			</p>
			<CreateWorkspaceConfigModal>
				{#snippet triggerChild({ props })}
					<Button {...props} class="mt-4">Create Workspace</Button>
				{/snippet}
			</CreateWorkspaceConfigModal>
		</div>
	{:else}
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						{#if columnVisibility.folderName !== false}<Table.Head
							></Table.Head>{/if}
						{#if columnVisibility.gitPort !== false}<Table.Head
							></Table.Head>{/if}
						{#if columnVisibility.url !== false}<Table.Head>URL</Table.Head
							>{/if}
						{#if columnVisibility.rootPath !== false}<Table.Head
								>Root Path</Table.Head
							>{/if}
						{#if columnVisibility.cwd !== false}<Table.Head>CWD</Table.Head
							>{/if}
						{#if columnVisibility.status !== false}<Table.Head
								>Status</Table.Head
							>{/if}
						{#if columnVisibility.lastUsed !== false}<Table.Head
								>Last Used</Table.Head
							>{/if}
						{#if columnVisibility.actions !== false}<Table.Head
								class="text-right">Actions</Table.Head
							>{/if}
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each workspaceConfigs.value as config}
						{@const workspace = getWorkspaceData(config.id)}
						<Table.Row>
							{#if columnVisibility.folderName !== false}
								<Table.Cell class="font-medium">
									{#if workspace?.connected}
										{getFolderName(workspace.appInfo.path.cwd)}
									{:else}
										<span class="text-muted-foreground">—</span>
									{/if}
								</Table.Cell>
							{/if}
							{#if columnVisibility.gitPort !== false}
								<Table.Cell>
									<div class="flex items-center gap-2">
										{#if workspace?.connected && workspace.appInfo.git?.enabled}
											<Tooltip.Root>
												<Tooltip.Trigger class="inline-flex">
													<GitBranch class="h-4 w-4 text-foreground" />
												</Tooltip.Trigger>
												<Tooltip.Content>
													<p>Git is enabled for this repository</p>
												</Tooltip.Content>
											</Tooltip.Root>
										{/if}
										<Badge variant="secondary" class="text-xs">
											{config.port || config.privatePort || 4096}
										</Badge>
									</div>
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
											onclick={() => handleConnect(config)}
										>
											Connect
										</Button>
										<EditWorkspaceConfigButton workspaceConfig={config} />
										<DeleteWorkspaceConfigButton workspaceConfig={config} />
									</div>
								</Table.Cell>
							{/if}
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>

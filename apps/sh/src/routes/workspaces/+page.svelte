<script lang="ts">
	import { Button, buttonVariants } from '@repo/ui/button';
	import * as Table from '@repo/ui/table';
	import * as DropdownMenu from '@repo/ui/dropdown-menu';
	import { workspaces } from '$lib/stores/workspaces.svelte';
	import { formatDistanceToNow } from '$lib/utils/date';
	import CreateWorkspaceDialog from '$lib/components/CreateWorkspaceDialog.svelte';
	import EditWorkspaceDialog from '$lib/components/EditWorkspaceDialog.svelte';
	import { goto } from '$app/navigation';
	import { Edit, Trash2, Plus, ChevronDown } from 'lucide-svelte';
	import * as AlertDialog from '@repo/ui/alert-dialog';
	import { toast } from 'svelte-sonner';
	import WorkspaceConnectionBadge from '$lib/components/WorkspaceConnectionBadge.svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import * as rpc from '$lib/query';
	import { cn } from '@repo/ui/utils';

	let editingWorkspace = $state<(typeof workspaces.value)[0] | null>(null);
	let deletingWorkspace = $state<(typeof workspaces.value)[0] | null>(null);

	// Define available columns
	const columns = [
		{ id: 'name', label: 'Name', hideable: false },
		{ id: 'url', label: 'URL', hideable: true },
		{ id: 'port', label: 'Port', hideable: true },
		{ id: 'rootPath', label: 'Root Path', hideable: true },
		{ id: 'cwd', label: 'CWD', hideable: true },
		{ id: 'status', label: 'Status', hideable: false },
		{ id: 'lastUsed', label: 'Last Used', hideable: true },
		{ id: 'actions', label: 'Actions', hideable: false },
	];

	// Persisted column visibility state
	let columnVisibility = $state({
		name: true,
		url: true,
		port: true,
		rootPath: false, // Hidden by default
		cwd: false, // Hidden by default
		status: true,
		lastUsed: true,
		actions: true,
	});

	const workspacesQuery = createQuery(() => ({
		...rpc.workspaces.getWorkspaces().options(),
		refetchInterval: 5000, // Refresh every 5 seconds
	}));

	// Helper to find workspace data by id
	function getWorkspaceData(configId: string) {
		return workspacesQuery.data?.find((w) => w.id === configId);
	}

	function handleConnect(workspace: (typeof workspaces.value)[0]) {
		// Update last used timestamp
		workspaces.value = workspaces.value.map((w) =>
			w.id === workspace.id ? { ...w, lastAccessedAt: Date.now() } : w,
		);

		// Navigate to workspace sessions
		goto(`/workspaces/${workspace.id}`);
	}

	function handleDelete(workspace: (typeof workspaces.value)[0]) {
		workspaces.value = workspaces.value.filter((w) => w.id !== workspace.id);
		deletingWorkspace = null;
		toast.success(`Deleted workspace "${workspace.name}"`);
	}
</script>

<div class="container max-w-screen-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
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

			<CreateWorkspaceDialog>
				{#snippet triggerChild({ props })}
					<Button {...props}><Plus class="mr-2 h-4 w-4" /> Add Workspace</Button
					>
				{/snippet}
			</CreateWorkspaceDialog>
		</div>
	</div>

	{#if workspaces.value.length === 0}
		<div class="rounded-lg border border-dashed p-8 text-center">
			<h3 class="text-lg font-semibold">No workspaces yet</h3>
			<p class="text-muted-foreground mt-2">
				Create your first workspace to connect to an OpenCode server
			</p>
			<CreateWorkspaceDialog>
				{#snippet triggerChild({ props })}
					<Button {...props} class="mt-4">Create Workspace</Button>
				{/snippet}
			</CreateWorkspaceDialog>
		</div>
	{:else}
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						{#if columnVisibility.name !== false}<Table.Head>Name</Table.Head
							>{/if}
						{#if columnVisibility.url !== false}<Table.Head>URL</Table.Head
							>{/if}
						{#if columnVisibility.port !== false}<Table.Head>Port</Table.Head
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
					{#each workspaces.value as config}
						{@const workspace = getWorkspaceData(config.id)}
						<Table.Row>
							{#if columnVisibility.name !== false}
								<Table.Cell class="font-medium">{config.name}</Table.Cell>
							{/if}
							{#if columnVisibility.url !== false}
								<Table.Cell class="max-w-[200px] truncate">
									<code class="text-xs">{config.url}</code>
								</Table.Cell>
							{/if}
							{#if columnVisibility.port !== false}
								<Table.Cell>{config.port}</Table.Cell>
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
									<WorkspaceConnectionBadge workspace={config} />
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
										<Button
											size="icon"
											variant="ghost"
											onclick={() => (editingWorkspace = config)}
										>
											<Edit class="h-4 w-4" />
										</Button>
										<Button
											size="icon"
											variant="ghost"
											onclick={() => (deletingWorkspace = config)}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
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

{#if editingWorkspace}
	<EditWorkspaceDialog
		workspace={editingWorkspace}
		open={!!editingWorkspace}
		onOpenChange={(open) => {
			if (!open) editingWorkspace = null;
		}}
	/>
{/if}

<AlertDialog.Root open={!!deletingWorkspace}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This will permanently delete the workspace "{deletingWorkspace?.name}".
				This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => (deletingWorkspace = null)}>
				Cancel
			</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={() => deletingWorkspace && handleDelete(deletingWorkspace)}
			>
				Delete
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<script lang="ts">
	import { Button } from '@repo/ui/button';
	import * as Table from '@repo/ui/table';
	import { Badge } from '@repo/ui/badge';
	import { workspaces } from '$lib/stores/workspaces.svelte';
	import { formatDistanceToNow } from '$lib/utils/date';
	import CreateWorkspaceDialog from '$lib/components/CreateWorkspaceDialog.svelte';
	import EditWorkspaceDialog from '$lib/components/EditWorkspaceDialog.svelte';
	import { goto } from '$app/navigation';
	import { Edit, Trash2 } from 'lucide-svelte';
	import * as AlertDialog from '@repo/ui/alert-dialog';
	import { toast } from 'svelte-sonner';
	import WorkspaceConnectionBadge from '$lib/components/WorkspaceConnectionBadge.svelte';

	let createDialogOpen = $state(false);
	let editingWorkspace = $state<typeof workspaces.value[0] | null>(null);
	let deletingWorkspace = $state<typeof workspaces.value[0] | null>(null);

	function handleConnect(workspace: typeof workspaces.value[0]) {
		// Update last used timestamp
		workspaces.value = workspaces.value.map(w => 
			w.id === workspace.id ? { ...w, lastUsedAt: Date.now() } : w
		);
		
		// Navigate to workspace sessions
		goto(`/workspaces/${workspace.id}`);
	}

	function handleDelete(workspace: typeof workspaces.value[0]) {
		workspaces.value = workspaces.value.filter(w => w.id !== workspace.id);
		deletingWorkspace = null;
		toast.success(`Deleted workspace "${workspace.name}"`);
	}
</script>

<div class="container mx-auto py-10">
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Workspaces</h1>
			<p class="text-muted-foreground mt-1">
				Manage your OpenCode server connections
			</p>
		</div>
		<Button onclick={() => createDialogOpen = true}>
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
			Add Workspace
		</Button>
	</div>

	{#if workspaces.value.length === 0}
		<div class="rounded-lg border border-dashed p-8 text-center">
			<h3 class="text-lg font-semibold">No workspaces yet</h3>
			<p class="text-muted-foreground mt-2">
				Create your first workspace to connect to an OpenCode server
			</p>
			<Button onclick={() => createDialogOpen = true} class="mt-4">
				Create Workspace
			</Button>
		</div>
	{:else}
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>URL</Table.Head>
						<Table.Head>Port</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Last Used</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each workspaces.value as config}
						<Table.Row>
							<Table.Cell class="font-medium">{config.name}</Table.Cell>
							<Table.Cell class="max-w-[200px] truncate">
								<code class="text-xs">{config.url}</code>
							</Table.Cell>
							<Table.Cell>{config.port}</Table.Cell>
							<Table.Cell>
								<WorkspaceConnectionBadge workspace={config} />
							</Table.Cell>
							<Table.Cell>
								{formatDistanceToNow(new Date(config.lastUsedAt))} ago
							</Table.Cell>
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
										onclick={() => editingWorkspace = config}
									>
										<Edit class="h-4 w-4" />
									</Button>
									<Button
										size="icon"
										variant="ghost"
										onclick={() => deletingWorkspace = config}
									>
										<Trash2 class="h-4 w-4" />
									</Button>
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>

<CreateWorkspaceDialog bind:open={createDialogOpen} />

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
			<AlertDialog.Cancel onclick={() => deletingWorkspace = null}>
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
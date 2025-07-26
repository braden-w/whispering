<script lang="ts">
	import { page } from '$app/state';
	import CreateWorkspaceConfigModal from '$lib/components/CreateWorkspaceConfigModal.svelte';
	import WorkspaceTableRow from '$lib/components/WorkspaceTableRow.svelte';
	import { workspaceConfigs } from '$lib/stores/workspace-configs.svelte';
	import { useCreateWorkspaceParams } from '$lib/stores/workspace-configs.svelte';
	import { Button, buttonVariants } from '@repo/ui/button';
	import * as DropdownMenu from '@repo/ui/dropdown-menu';
	import * as Table from '@repo/ui/table';
	import { cn } from '@repo/ui/utils';
	import { ChevronDown, Plus } from 'lucide-svelte';
	import { useFlashMessage } from '$lib/utils/redirects.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Define available columns
	const columns = [
		{ hideable: false, id: 'name', label: 'Name' },
		{ hideable: false, id: 'port', label: 'Port' },
		{ hideable: true, id: 'url', label: 'URL' },
		{ hideable: true, id: 'rootPath', label: 'Root Path' },
		{ hideable: true, id: 'cwd', label: 'CWD' },
		{ hideable: false, id: 'status', label: 'Status' },
		{ hideable: true, id: 'lastUsed', label: 'Last Used' },
		{ hideable: false, id: 'actions', label: 'Actions' },
	] as const;

	type ColumnId = (typeof columns)[number]['id'];

	// Persisted column visibility state
	let columnVisibility = $state<Record<ColumnId, boolean>>({
		actions: true,
		cwd: false, // Hidden by default
		lastUsed: true,
		name: true,
		port: true,
		rootPath: false, // Hidden by default
		status: true,
		url: true,
	});

	useFlashMessage(page.url);
	useCreateWorkspaceParams(page.url);
</script>

<div class="px-4 sm:px-6 py-6 sm:py-8">
	<div
		class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
	>
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
		<div class="rounded border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						{#if columnVisibility.name !== false}<Table.Head>Name</Table.Head
							>{/if}
						{#if columnVisibility.port !== false}<Table.Head>Port</Table.Head
							>{/if}
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
						<WorkspaceTableRow {config} {columnVisibility} />
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>

<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { TrashIcon } from '$lib/components/icons';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { createTransformationsQuery } from '$lib/queries/transformations';
	import type { Transformation } from '$lib/services/db';
	import { cn } from '$lib/utils';
	import { createPersistedState } from '$lib/utils/createPersistedState.svelte';
	import {
		FlexRender,
		createTable,
		renderComponent,
	} from '@tanstack/svelte-table';
	import type { ColumnDef, ColumnFilter, Updater } from '@tanstack/table-core';
	import {
		getCoreRowModel,
		getFilteredRowModel,
		getSortedRowModel,
	} from '@tanstack/table-core';
	import { ChevronDownIcon, PlusIcon } from 'lucide-svelte';
	import { z } from 'zod';
	import DataTableHeader from './DataTableHeader.svelte';
	import TransformationRowActions from './TransformationRowActions.svelte';
	import { createDeleteTransformationWithToast } from '$lib/mutations/transformations';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	const columns: ColumnDef<Transformation>[] = [
		{
			id: 'select',
			header: ({ table }) =>
				renderComponent(Checkbox, {
					checked: table.getIsAllPageRowsSelected(),
					onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value),
					'aria-label': 'Select all',
				}),
			cell: ({ row }) =>
				renderComponent(Checkbox, {
					checked: row.getIsSelected(),
					onCheckedChange: (value) => row.toggleSelected(!!value),
					'aria-label': 'Select row',
				}),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: 'id',
			meta: {
				headerText: 'ID',
			},
			header: (headerContext) =>
				renderComponent(DataTableHeader, headerContext),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: 'title',
			meta: {
				headerText: 'Title',
			},
			header: (headerContext) =>
				renderComponent(DataTableHeader, headerContext),
		},
		{
			accessorKey: 'description',
			meta: {
				headerText: 'Description',
			},
			header: (headerContext) =>
				renderComponent(DataTableHeader, headerContext),
		},
		{
			accessorKey: 'createdAt',
			meta: {
				headerText: 'Created At',
			},
			header: (headerContext) =>
				renderComponent(DataTableHeader, headerContext),
		},
		{
			accessorKey: 'updatedAt',
			meta: {
				headerText: 'Updated At',
			},
			header: (headerContext) =>
				renderComponent(DataTableHeader, headerContext),
		},
		{
			id: 'actions',
			accessorFn: (transformation) => transformation,
			meta: {
				headerText: 'Actions',
			},
			header: 'Actions',
			cell: ({ getValue }) => {
				const transformation = getValue<Transformation>();
				return renderComponent(TransformationRowActions, { transformation });
			},
		},
	];

	let sorting = createPersistedState({
		key: 'whispering-transformations-data-table-sorting',
		defaultValue: [{ id: 'createdAt', desc: true }],
		schema: z.array(z.object({ desc: z.boolean(), id: z.string() })),
	});
	let columnFilters = createPersistedState({
		key: 'whispering-transformations-data-table-column-filters',
		defaultValue: [],
		schema: z
			.object({ id: z.string(), value: z.unknown() })
			.refine((data): data is ColumnFilter => data.value !== undefined)
			.array(),
	});
	let columnVisibility = createPersistedState({
		key: 'whispering-transformations-data-table-column-visibility',
		defaultValue: {
			id: false,
			createdAt: false,
			updatedAt: false,
		},
		schema: z.record(z.string(), z.boolean()),
	});
	let rowSelection = createPersistedState({
		key: 'whispering-transformations-data-table-row-selection',
		defaultValue: {},
		schema: z.record(z.string(), z.boolean()),
	});

	function createUpdater<T>(state: { value: T }) {
		return (updater: Updater<T>) => {
			if (updater instanceof Function) {
				state.value = updater(state.value);
			} else {
				state.value = updater;
			}
		};
	}

	const setSorting = createUpdater(sorting);
	const setFilters = createUpdater(columnFilters);
	const setVisibility = createUpdater(columnVisibility);
	const setRowSelection = createUpdater(rowSelection);

	const transformationsQuery = createTransformationsQuery();
	const deleteTransformationWithToastMutation =
		createDeleteTransformationWithToast();

	const table = createTable({
		getRowId: (originalRow) => originalRow.id,
		get data() {
			return transformationsQuery.data ?? [];
		},
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: setSorting,
		onColumnFiltersChange: setFilters,
		onColumnVisibilityChange: setVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			get sorting() {
				return sorting.value;
			},
			get columnFilters() {
				return columnFilters.value;
			},
			get columnVisibility() {
				return columnVisibility.value;
			},
			get rowSelection() {
				return rowSelection.value;
			},
		},
	});

	function getInitialFilterValue() {
		const filterValue = table.getColumn('title')?.getFilterValue();
		if (typeof filterValue === 'string') {
			return filterValue;
		}
		return '';
	}
	let filterQuery = $state(getInitialFilterValue());
	const selectedTransformationRows = $derived(
		table.getFilteredSelectedRowModel().rows,
	);
</script>

<svelte:head>
	<title>All Transformations</title>
</svelte:head>

<main class="flex w-full flex-1 flex-col gap-2 px-4 py-4 md:px-8">
	<h1 class="scroll-m=20 text-4xl font-bold tracking-tight lg:text-5xl">
		Transformations
	</h1>
	<p class="text-muted-foreground">
		Your text transformations, stored locally in IndexedDB.
	</p>
	<div class="space-y-4 rounded-md border p-6">
		<div class="flex flex-col items-center gap-2 overflow-auto sm:flex-row">
			<form
				class="flex w-full max-w-sm gap-2"
				onsubmit={(e) => {
					e.preventDefault();
					table.getColumn('title')?.setFilterValue(filterQuery);
				}}
			>
				<Input
					placeholder="Filter transformations..."
					type="text"
					bind:value={filterQuery}
				/>
				<Button variant="outline" type="submit">Search</Button>
			</form>
			<div class="flex w-full items-center justify-between gap-2">
				{#if selectedTransformationRows.length > 0}
					<WhisperingButton
						tooltipContent="Delete selected transformations"
						variant="outline"
						size="icon"
						onclick={() => {
							confirmationDialog.open({
								title: 'Delete transformations',
								subtitle:
									'Are you sure you want to delete these transformations?',
								onConfirm: () => {
									selectedTransformationRows.forEach(({ original }) => {
										deleteTransformationWithToastMutation.mutate(original);
									});
								},
							});
						}}
					>
						<TrashIcon class="h-4 w-4" />
					</WhisperingButton>
				{/if}

				<div
					class={cn(
						'text-muted-foreground text-sm sm:block',
						selectedTransformationRows.length > 0 && 'hidden',
					)}
				>
					{selectedTransformationRows.length} of
					{table.getFilteredRowModel().rows.length} row(s) selected.
				</div>

				<div class="ml-auto flex items-center gap-2">
					<Dialog.Root>
						<Dialog.Trigger>
							{#snippet child({ props })}
								<Button {...props}>
									<PlusIcon class="h-4 w-4" />
									Create Transformation
								</Button>
							{/snippet}
						</Dialog.Trigger>

						<Dialog.Content>
							<Dialog.Header>
								<Dialog.Title>Create Transformation</Dialog.Title>
								<Dialog.Description>
									Create a new transformation to transform text.
								</Dialog.Description>
							</Dialog.Header>
							<Input placeholder="Title" />
							<Input placeholder="Description" />
							<Dialog.Footer>
								<Dialog.Close>Cancel</Dialog.Close>
								<Button>Create</Button>
							</Dialog.Footer>
						</Dialog.Content>
					</Dialog.Root>

					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class={cn(
								buttonVariants({ variant: 'outline' }),
								'transition-all [&[data-state=open]>svg]:rotate-180',
							)}
						>
							Columns
							<ChevronDownIcon
								class="ml-2 h-4 w-4 transition-transform duration-200"
							/>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content>
							{#each table
								.getAllColumns()
								.filter((c) => c.getCanHide()) as column (column.id)}
								<DropdownMenu.CheckboxItem
									checked={column.getIsVisible()}
									onCheckedChange={(value) => column.toggleVisibility(!!value)}
								>
									{column.columnDef.meta?.headerText}
								</DropdownMenu.CheckboxItem>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			</div>
		</div>

		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup}
					<Table.Row>
						{#each headerGroup.headers as header}
							<Table.Head colspan={header.colSpan}>
								{#if !header.isPlaceholder}
									<FlexRender
										content={header.column.columnDef.header}
										context={header.getContext()}
									/>
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body>
				{#each table.getRowModel().rows as row (row.id)}
					<Table.Row>
						{#each row.getVisibleCells() as cell}
							<Table.Cell>
								<FlexRender
									content={cell.column.columnDef.cell}
									context={cell.getContext()}
								/>
							</Table.Cell>
						{/each}
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</main>

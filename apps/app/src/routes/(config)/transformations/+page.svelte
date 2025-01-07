<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { TrashIcon } from '$lib/components/icons';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import {
		createCreateTransformationWithToast,
		createDeleteTransformationWithToast,
		createDeleteTransformationsWithToast,
	} from '$lib/mutations/transformations';
	import { createTransformationsQuery } from '$lib/queries/transformations';
	import {
		type Transformation,
		generateDefaultTransformation,
	} from '$lib/services/db';
	import { settings } from '$lib/stores/settings.svelte';
	import { cn } from '$lib/utils';
	import { createPersistedState } from '$lib/utils/createPersistedState.svelte';
	import {
		FlexRender,
		createTable,
		renderComponent,
	} from '@tanstack/svelte-table';
	import type {
		ColumnDef,
		ColumnFiltersState,
		PaginationState,
	} from '@tanstack/table-core';
	import {
		getCoreRowModel,
		getFilteredRowModel,
		getPaginationRowModel,
		getSortedRowModel,
	} from '@tanstack/table-core';
	import { ChevronDownIcon, PlusIcon } from 'lucide-svelte';
	import { z } from 'zod';
	import RenderTransformation from './-components/RenderTransformation.svelte';
	import DataTableHeader from './DataTableHeader.svelte';
	import TransformationRowActions from './TransformationRowActions.svelte';

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
		defaultValue: [{ id: 'title', desc: false }],
		schema: z.array(z.object({ desc: z.boolean(), id: z.string() })),
	});
	let columnFilters = $state<ColumnFiltersState>([]);
	let rowSelection = createPersistedState({
		key: 'whispering-transformations-data-table-row-selection',
		defaultValue: {},
		schema: z.record(z.string(), z.boolean()),
	});
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });

	const transformationsQuery = createTransformationsQuery();
	const deleteTransformationWithToastMutation =
		createDeleteTransformationWithToast();
	const deleteTransformationsWithToastMutation =
		createDeleteTransformationsWithToast();

	const table = createTable({
		getRowId: (originalRow) => originalRow.id,
		get data() {
			return transformationsQuery.data ?? [];
		},
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: (updater) => {
			if (typeof updater === 'function') {
				sorting.value = updater(sorting.value);
			} else {
				sorting.value = updater;
			}
		},
		onColumnFiltersChange: (updater) => {
			if (typeof updater === 'function') {
				columnFilters = updater(columnFilters);
			} else {
				columnFilters = updater;
			}
		},
		onPaginationChange: (updater) => {
			if (typeof updater === 'function') {
				pagination = updater(pagination);
			} else {
				pagination = updater;
			}
		},
		state: {
			get sorting() {
				return sorting.value;
			},
			get columnFilters() {
				return columnFilters;
			},
			get rowSelection() {
				return rowSelection.value;
			},
			get pagination() {
				return pagination;
			},
		},
	});

	const selectedTransformationRows = $derived(
		table.getFilteredSelectedRowModel().rows,
	);

	let transformation = $state(generateDefaultTransformation());
	let isDialogOpen = $state(false);
	const createTransformationWithToastMutation =
		createCreateTransformationWithToast();

	const selectedTransformation = $derived(
		transformationsQuery.data?.find(
			(t) =>
				t.id === settings.value['transformations.selectedTransformationId'],
		),
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

	<Resizable.PaneGroup
		direction="horizontal"
		class="rounded-lg border gap-6 p-6"
	>
		<Resizable.Pane defaultSize={50} class="flex flex-col gap-4">
			<div class="flex flex-col items-center justify-between gap-2">
				<Input
					placeholder="Filter transformations..."
					type="text"
					class="w-full"
					value={table.getColumn('title')?.getFilterValue() as string}
					oninput={(e) =>
						table.getColumn('title')?.setFilterValue(e.currentTarget.value)}
				/>
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
									confirmText: 'Delete',
									onConfirm: () => {
										deleteTransformationsWithToastMutation.mutate(
											selectedTransformationRows.map(
												({ original }) => original,
											),
										);
									},
								});
							}}
						>
							<TrashIcon class="h-4 w-4" />
						</WhisperingButton>
					{/if}

					<div class="flex items-center gap-2">
						<Dialog.Root bind:open={isDialogOpen}>
							<Dialog.Trigger>
								{#snippet child({ props })}
									<Button {...props}>
										<PlusIcon class="h-4 w-4 mr-2" />
										Create Transformation
									</Button>
								{/snippet}
							</Dialog.Trigger>

							<Dialog.Content
								class="overflow-y-auto max-h-[90vh] max-w-3xl"
								onInteractOutside={(e) => {
									e.preventDefault();
									if (isDialogOpen) {
										confirmationDialog.open({
											title: 'Unsaved changes',
											subtitle:
												'You have unsaved changes. Are you sure you want to leave?',
											confirmText: 'Leave',
											onConfirm: () => {
												isDialogOpen = false;
											},
										});
									}
								}}
							>
								<Dialog.Header>
									<Dialog.Title>Create Transformation</Dialog.Title>
									<Dialog.Description>
										Create a new transformation to transform text.
									</Dialog.Description>
								</Dialog.Header>
								<RenderTransformation
									{transformation}
									onChange={(newTransformation) => {
										transformation = newTransformation;
									}}
								/>
								<Dialog.Footer>
									<Button
										variant="outline"
										onclick={() => (isDialogOpen = false)}
									>
										Cancel
									</Button>
									<Button
										type="submit"
										onclick={() =>
											createTransformationWithToastMutation.mutate(
												$state.snapshot(transformation),
												{
													onSuccess: () => {
														isDialogOpen = false;
														transformation = generateDefaultTransformation();
													},
												},
											)}
									>
										Create
									</Button>
								</Dialog.Footer>
							</Dialog.Content>
						</Dialog.Root>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger
								class={cn(
									buttonVariants({ variant: 'outline' }),
									'ml-auto items-center transition-all [&[data-state=open]>svg]:rotate-180',
								)}
							>
								Columns <ChevronDownIcon
									class="ml-2 h-4 w-4 transition-transform duration-200"
								/>
							</DropdownMenu.Trigger>
							<DropdownMenu.Content>
								{#each table
									.getAllColumns()
									.filter((c) => c.getCanHide()) as column (column.id)}
									<DropdownMenu.CheckboxItem
										checked={column.getIsVisible()}
										onCheckedChange={(value) =>
											column.toggleVisibility(!!value)}
									>
										{column.columnDef.meta?.headerText}
									</DropdownMenu.CheckboxItem>
								{/each}
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</div>
				</div>
			</div>

			<div class="rounded-md border">
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
						{#if transformationsQuery.isPending}
							{#each { length: 5 }}
								<Table.Row>
									<Table.Cell>
										<Skeleton class="h-4 w-4" />
									</Table.Cell>
									<Table.Cell colspan={columns.length - 1}>
										<Skeleton class="h-4 w-full" />
									</Table.Cell>
								</Table.Row>
							{/each}
						{:else if table.getRowModel().rows?.length}
							{#each table.getRowModel().rows as row (row.id)}
								<Table.Row
									class={cn('cursor-pointer hover:bg-muted/50', {
										'bg-muted/75':
											row.id ===
											settings.value[
												'transformations.selectedTransformationId'
											],
									})}
									onclick={() => {
										settings.value = {
											...settings.value,
											'transformations.selectedTransformationId': row.id,
										};
									}}
								>
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
						{:else}
							<Table.Row>
								<Table.Cell colspan={columns.length} class="h-24 text-center">
									{#if filterQuery}
										No transformations found.
									{:else}
										No transformations yet. Click "Create Transformation" to add
										one.
									{/if}
								</Table.Cell>
							</Table.Row>
						{/if}
					</Table.Body>
				</Table.Root>
			</div>

			<div class="flex items-center justify-between">
				<div class="text-muted-foreground text-sm">
					{selectedTransformationRows.length} of {table.getFilteredRowModel()
						.rows.length} row(s) selected.
				</div>
				<div class="flex items-center space-x-2">
					<Button
						variant="outline"
						size="sm"
						onclick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						onclick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						Next
					</Button>
				</div>
			</div>
		</Resizable.Pane>
		<Resizable.Handle />
		<Resizable.Pane defaultSize={50}>
			{#if selectedTransformation}
				<RenderTransformation
					transformation={selectedTransformation}
					onChange={(newTransformation) => {
						// TODO: Add update mutation
						console.log('Update transformation:', newTransformation);
					}}
				/>
			{:else}
				<div
					class="flex h-[50vh] items-center justify-center rounded-md border"
				>
					<div class="text-center">
						<h3 class="text-lg font-medium">No transformation selected</h3>
						<p class="text-muted-foreground mt-2">
							Select a transformation from the list to edit it
						</p>
					</div>
				</div>
			{/if}
		</Resizable.Pane>
	</Resizable.PaneGroup>
</main>

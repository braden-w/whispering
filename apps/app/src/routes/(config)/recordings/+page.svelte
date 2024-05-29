<script lang="ts">
	import { createPersistedState } from '$lib/createPersistedState.svelte';
	import { recordings } from '$lib/stores';
	import type { Recording } from '@repo/services/services/recordings-db';
	import { FlexRender, createSvelteTable, renderComponent } from '@repo/svelte-table';
	import { Button } from '@repo/ui/components/button';
	import { Checkbox } from '@repo/ui/components/checkbox';
	import * as DropdownMenu from '@repo/ui/components/dropdown-menu';
	import { Input } from '@repo/ui/components/input';
	import * as Table from '@repo/ui/components/table';
	import type { ColumnDef, ColumnFilter, Updater } from '@tanstack/table-core';
	import { getCoreRowModel, getSortedRowModel } from '@tanstack/table-core';
	import { Effect } from 'effect';
	import { z } from 'zod';
	import ChevronDown from '~icons/heroicons/chevron-down';
	import LoadingTranscriptionIcon from '~icons/heroicons/ellipsis-horizontal';
	import TrashIcon from '~icons/heroicons/trash';
	import StartTranscriptionIcon from '~icons/lucide/play';
	import RetryTranscriptionIcon from '~icons/lucide/repeat';
	import DataTableHeader from './DataTableHeader.svelte';
	import RenderAudioUrl from './RenderAudioUrl.svelte';
	import RowActions from './RowActions.svelte';
	import TranscribedText from './TranscribedText.svelte';

	const columns: ColumnDef<Recording>[] = [
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
			header: (headerContext) => renderComponent(DataTableHeader, headerContext),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: 'title',
			meta: {
				headerText: 'Title',
			},
			header: (headerContext) => renderComponent(DataTableHeader, headerContext),
		},
		{
			accessorKey: 'subtitle',
			meta: {
				headerText: 'Subtitle',
			},
			header: (headerContext) => renderComponent(DataTableHeader, headerContext),
		},
		{
			accessorKey: 'timestamp',
			meta: {
				headerText: 'Timestamp',
			},
			header: (headerContext) => renderComponent(DataTableHeader, headerContext),
		},
		{
			accessorFn: ({ id, transcribedText }) => ({ id, transcribedText }),
			meta: {
				headerText: 'Transcribed Text',
			},
			header: 'Transcribed Text',
			cell: ({ getValue }) => {
				const { id, transcribedText } = getValue<{ id: string; transcribedText: string }>();
				return renderComponent(TranscribedText, { recordingId: id, transcribedText });
			},
		},
		{
			accessorFn: ({ id, blob }) => ({ id, blob }),
			meta: {
				headerText: 'Audio',
			},
			header: 'Audio',
			cell: ({ getValue }) => {
				const { id, blob } = getValue<{ id: string; blob: Blob }>();
				const audioUrl = URL.createObjectURL(blob);
				return renderComponent(RenderAudioUrl, { recordingId: id, audioUrl });
			},
		},
		{
			accessorFn: (recording) => recording,
			meta: {
				headerText: 'Actions',
			},
			header: 'Actions',
			cell: ({ getValue }) => {
				const recording = getValue<Recording>();
				return renderComponent(RowActions, { recording });
			},
		},
	];

	let sorting = createPersistedState({
		key: 'whispering-sorting',
		defaultValue: [{ id: 'timestamp', desc: true }],
		schema: z.array(z.object({ desc: z.boolean(), id: z.string() })),
	});
	let columnFilters = createPersistedState({
		key: 'whispering-column-filters',
		defaultValue: [],
		schema: z.array(
			z
				.object({ id: z.string(), value: z.unknown() })
				.refine((data): data is ColumnFilter => data.value !== undefined),
		),
	});
	let columnVisibility = createPersistedState({
		key: 'whispering-column-visibility',
		defaultValue: { id: false, title: false, subtitle: false, timestamp: false },
		schema: z.record(z.boolean()),
	});
	let rowSelection = createPersistedState({
		key: 'whispering-row-selection',
		defaultValue: {},
		schema: z.record(z.boolean()),
	});

	function createUpdater<T>(state: { value: T }) {
		return function (updater: Updater<T>) {
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

	const table = createSvelteTable({
		getRowId: (originalRow) => originalRow.id,
		get data() {
			return recordings.value;
		},
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
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
		debugTable: true,
	});

	let selectedRecordingRows = $derived(table.getFilteredSelectedRowModel().rows);
</script>

<svelte:head>
	<title>All Recordings</title>
</svelte:head>

<div class="container flex flex-col gap-2 px-0">
	<h1 class="scroll-m=20 text-4xl font-bold tracking-tight lg:text-5xl">Recordings</h1>
	<p class="text-muted-foreground">Your latest recordings and transcriptions</p>
	<div class="space-y-4 rounded-md border p-6">
		<div class="flex items-center gap-2">
			<Input
				class="max-w-sm"
				placeholder="Filter recordings..."
				type="text"
				value={table.getColumn('id')?.getFilterValue()}
				onchange={(e) => table.getColumn('id')?.setFilterValue(e.currentTarget.value)}
			/>
			{#if selectedRecordingRows.length > 0}
				<Button
					variant="outline"
					size="icon"
					on:click={() => {
						Promise.all(
							selectedRecordingRows.map((recording) =>
								recordings.transcribeRecording(recording.id),
							),
						);
					}}
				>
					{#if selectedRecordingRows.some(({ id }) => {
						const currentRow = recordings.value.find((r) => r.id === id);
						return currentRow?.transcriptionStatus === 'TRANSCRIBING';
					})}
						<LoadingTranscriptionIcon />
					{:else if selectedRecordingRows.some(({ id }) => {
						const currentRow = recordings.value.find((r) => r.id === id);
						return currentRow?.transcriptionStatus === 'DONE';
					})}
						<RetryTranscriptionIcon />
					{:else}
						<StartTranscriptionIcon />
					{/if}
				</Button>
				<Button
					variant="outline"
					size="icon"
					on:click={() => {
						const ids = selectedRecordingRows.map(({ id }) => id);
						recordings.deleteRecordingsById(ids).pipe(Effect.runPromise);
					}}
				>
					<TrashIcon />
				</Button>
			{/if}
			<div class="text-muted-foreground text-sm">
				{selectedRecordingRows.length} of
				{table.getFilteredRowModel().rows.length} row(s) selected.
			</div>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild let:builder>
					<Button variant="outline" class="ml-auto" builders={[builder]}>
						Columns <ChevronDown class="ml-2 h-4 w-4" />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					{#each table.getAllColumns().filter((c) => c.getCanHide()) as column (column.id)}
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
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							</Table.Cell>
						{/each}
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>

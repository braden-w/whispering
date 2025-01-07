<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { ClipboardIcon, TrashIcon } from '$lib/components/icons';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { createRecordingsQuery } from '$lib/queries/recordings';
	import type { Recording } from '$lib/services/db';
	import { cn } from '$lib/utils';
	import { userConfiguredServices } from '$lib/services/index.js';
	import { createPersistedState } from '$lib/utils/createPersistedState.svelte';
	import {
		FlexRender,
		createTable,
		renderComponent,
	} from '@tanstack/svelte-table';
	import type {
		ColumnDef,
		ColumnFilter,
		ColumnFiltersState,
		PaginationState,
		Updater,
	} from '@tanstack/table-core';
	import {
		getCoreRowModel,
		getFilteredRowModel,
		getPaginationRowModel,
		getSortedRowModel,
	} from '@tanstack/table-core';
	import {
		ChevronDownIcon,
		EllipsisIcon as LoadingTranscriptionIcon,
		RepeatIcon as RetryTranscriptionIcon,
		PlayIcon as StartTranscriptionIcon,
	} from 'lucide-svelte';
	import { z } from 'zod';
	import DataTableHeader from './DataTableHeader.svelte';
	import RenderAudioUrl from './RenderAudioUrl.svelte';
	import RowActions from './RowActions.svelte';
	import TranscribedText from './TranscribedText.svelte';
	import { createDeleteRecordingsWithToast } from '$lib/mutations/recordings';
	import { transcriber } from '$lib/stores/transcriber.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

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
			accessorKey: 'subtitle',
			meta: {
				headerText: 'Subtitle',
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
			id: 'transcribedText',
			filterFn: (row, _columnId, filterValue) => {
				const { transcribedText } = row.getValue<{
					id: string;
					transcribedText: string;
				}>('transcribedText');
				return transcribedText.includes(filterValue);
			},
			accessorFn: ({ id, transcribedText }) => ({ id, transcribedText }),
			meta: {
				headerText: 'Transcribed Text',
			},
			header: 'Transcribed Text',
			cell: ({ getValue }) => {
				const { id, transcribedText } = getValue<{
					id: string;
					transcribedText: string;
				}>();
				return renderComponent(TranscribedText, {
					recordingId: id,
					transcribedText,
				});
			},
		},
		{
			id: 'audio',
			accessorFn: ({ id, blob }) => ({ id, blob }),
			meta: {
				headerText: 'Audio',
			},
			header: 'Audio',
			cell: ({ getValue }) => {
				const { id, blob } = getValue<Pick<Recording, 'id' | 'blob'>>();
				return renderComponent(RenderAudioUrl, { id, blob });
			},
		},
		{
			id: 'actions',
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
		key: 'whispering-recordings-data-table-sorting',
		defaultValue: [{ id: 'createdAt', desc: true }],
		schema: z.array(z.object({ desc: z.boolean(), id: z.string() })),
	});
	let columnFilters = $state<ColumnFiltersState>([]);
	let columnVisibility = createPersistedState({
		key: 'whispering-recordings-data-table-column-visibility',
		defaultValue: {
			id: false,
			title: false,
			subtitle: false,
			createdAt: false,
			updatedAt: false,
		},
		schema: z.record(z.string(), z.boolean()),
	});
	let rowSelection = createPersistedState({
		key: 'whispering-recordings-data-table-row-selection',
		defaultValue: {},
		schema: z.record(z.string(), z.boolean()),
	});
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });

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
	const setVisibility = createUpdater(columnVisibility);
	const setRowSelection = createUpdater(rowSelection);

	const recordingsQuery = createRecordingsQuery();

	const deleteRecordingsWithToastMutation = createDeleteRecordingsWithToast();

	const table = createTable({
		getRowId: (originalRow) => originalRow.id,
		get data() {
			return recordingsQuery.data ?? [];
		},
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		onColumnFiltersChange: (updater) => {
			if (typeof updater === 'function') {
				columnFilters = updater(columnFilters);
			} else {
				columnFilters = updater;
			}
		},
		onColumnVisibilityChange: setVisibility,
		onRowSelectionChange: setRowSelection,
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
				return columnFilters.value;
			},
			get columnVisibility() {
				return columnVisibility.value;
			},
			get rowSelection() {
				return rowSelection.value;
			},
			get pagination() {
				return pagination;
			},
		},
	});

	function getInitialFilterValue() {
		const filterValue = table.getColumn('transcribedText')?.getFilterValue();
		if (typeof filterValue === 'string') {
			return filterValue;
		}
		return '';
	}
	let filterQuery = $state(getInitialFilterValue());
	const selectedRecordingRows = $derived(
		table.getFilteredSelectedRowModel().rows,
	);

	let template = $state('{{createdAt}} {{transcribedText}}');
	let delimiter = $state('\n\n');

	let isDialogOpen = $state(false);

	const joinedTranscriptionsText = $derived.by(() => {
		const transcriptions = selectedRecordingRows
			.map(({ original }) => original)
			.filter((recording) => recording.transcribedText !== '')
			.map((recording) =>
				template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
					if (key in recording) {
						const value = recording[key as keyof Recording];
						return typeof value === 'string' ? value : '';
					}
					return '';
				}),
			);
		return transcriptions.join(delimiter);
	});
</script>

<svelte:head>
	<title>All Recordings</title>
</svelte:head>

<main class="flex w-full flex-1 flex-col gap-2 px-4 py-4 md:px-8">
	<h1 class="scroll-m=20 text-4xl font-bold tracking-tight lg:text-5xl">
		Recordings
	</h1>
	<p class="text-muted-foreground">
		Your latest recordings and transcriptions, stored locally in IndexedDB.
	</p>
	<div class="space-y-4 rounded-md border p-6">
		<div class="flex flex-col items-center gap-2 overflow-auto sm:flex-row">
			<form
				class="flex w-full max-w-sm gap-2"
				onsubmit={(e) => {
					e.preventDefault();
					table.getColumn('transcribedText')?.setFilterValue(filterQuery);
				}}
			>
				<Input
					placeholder="Filter transcripts..."
					type="text"
					bind:value={filterQuery}
				/>
				<Button variant="outline" type="submit">Search</Button>
			</form>
			<div class="flex w-full items-center justify-end gap-2">
				{#if selectedRecordingRows.length > 0}
					<WhisperingButton
						tooltipContent="Transcribe selected recordings"
						variant="outline"
						size="icon"
						onclick={() =>
							Promise.allSettled(
								selectedRecordingRows.map((recording) =>
									transcriber.transcribeAndUpdateRecordingWithToast(
										recording.original,
									),
								),
							)}
					>
						{#if selectedRecordingRows.some(({ id }) => {
							const currentRow = recordingsQuery.data?.find((r) => r.id === id);
							return currentRow?.transcriptionStatus === 'TRANSCRIBING';
						})}
							<LoadingTranscriptionIcon class="h-4 w-4" />
						{:else if selectedRecordingRows.some(({ id }) => {
							const currentRow = recordingsQuery.data?.find((r) => r.id === id);
							return currentRow?.transcriptionStatus === 'DONE';
						})}
							<RetryTranscriptionIcon class="h-4 w-4" />
						{:else}
							<StartTranscriptionIcon class="h-4 w-4" />
						{/if}
					</WhisperingButton>

					<Dialog.Root
						open={isDialogOpen}
						onOpenChange={(v) => (isDialogOpen = v)}
					>
						<Dialog.Trigger>
							<WhisperingButton
								tooltipContent="Copy transcribed text from selected recordings"
								variant="outline"
								size="icon"
							>
								<ClipboardIcon class="h-4 w-4" />
							</WhisperingButton>
						</Dialog.Trigger>
						<Dialog.Content>
							<Dialog.Header>
								<Dialog.Title>Copy Transcripts</Dialog.Title>
								<Dialog.Description>
									Make changes to your profile here. Click save when you're
									done.
								</Dialog.Description>
							</Dialog.Header>
							<div class="grid gap-4 py-4">
								<div class="grid grid-cols-4 items-center gap-4">
									<Label for="template" class="text-right">Template</Label>
									<Textarea
										id="template"
										bind:value={template}
										class="col-span-3"
									/>
								</div>
								<div class="grid grid-cols-4 items-center gap-4">
									<Label for="delimiter" class="text-right">Delimiter</Label>
									<Textarea
										id="delimiter"
										bind:value={delimiter}
										class="col-span-3"
									/>
								</div>
							</div>
							<Textarea
								placeholder="Preview of copied text"
								readonly
								class="h-32"
								value={joinedTranscriptionsText}
							/>
							<Dialog.Footer>
								<WhisperingButton
									tooltipContent="Copy transcriptions"
									onclick={async () => {
										await userConfiguredServices.clipboard.copyTextToClipboardWithToast(
											{
												label: 'transcribed text (joined)',
												text: joinedTranscriptionsText,
											},
										);
										isDialogOpen = false;
									}}
									type="submit"
								>
									Copy Transcriptions
								</WhisperingButton>
							</Dialog.Footer>
						</Dialog.Content>
					</Dialog.Root>

					<WhisperingButton
						tooltipContent="Delete selected recordings"
						variant="outline"
						size="icon"
						onclick={() => {
							confirmationDialog.open({
								title: 'Delete recordings',
								subtitle: 'Are you sure you want to delete these recordings?',
								confirmText: 'Delete',
								onConfirm: () => {
									deleteRecordingsWithToastMutation.mutate(
										selectedRecordingRows.map(({ original }) => original),
									);
								},
							});
						}}
					>
						<TrashIcon class="h-4 w-4" />
					</WhisperingButton>
				{/if}

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
								onCheckedChange={(value) => column.toggleVisibility(!!value)}
							>
								{column.columnDef.meta?.headerText}
							</DropdownMenu.CheckboxItem>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
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
					{#if recordingsQuery.isPending}
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
					{:else}
						<Table.Row>
							<Table.Cell colspan={columns.length} class="h-24 text-center">
								{#if filterQuery}
									No recordings found.
								{:else}
									No recordings yet. Start recording to add one.
								{/if}
							</Table.Cell>
						</Table.Row>
					{/if}
				</Table.Body>
			</Table.Root>
		</div>

		<div class="flex items-center justify-between">
			<div class="text-muted-foreground text-sm">
				{selectedRecordingRows.length} of {table.getFilteredRowModel().rows
					.length} row(s) selected.
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
	</div>
</main>

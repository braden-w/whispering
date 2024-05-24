<script lang="ts">
	import { recordings } from '$lib/stores/recordings';
	import { Button } from '@repo/ui/components/button';
	import * as DropdownMenu from '@repo/ui/components/dropdown-menu';
	import { Input } from '@repo/ui/components/input';
	import * as Table from '@repo/ui/components/table';
	import { Effect } from 'effect';
	import { derived, writable } from 'svelte/store';
	import ChevronDown from '~icons/heroicons/chevron-down';
	import LoadingTranscriptionIcon from '~icons/heroicons/ellipsis-horizontal';
	import TrashIcon from '~icons/heroicons/trash';
	import ArrowDown from '~icons/lucide/arrow-down';
	import ArrowUp from '~icons/lucide/arrow-up';
	import ArrowUpDown from '~icons/lucide/arrow-up-down';
	import StartTranscriptionIcon from '~icons/lucide/play';
	import RetryTranscriptionIcon from '~icons/lucide/repeat';
	import DataTableCheckbox from './DataTableCheckbox.svelte';
	import RenderAudioUrl from './RenderAudioUrl.svelte';
	import RowActions from './RowActions.svelte';
	import TranscribedText from './TranscribedText.svelte';
	import { FlexRender, createSvelteTable, renderComponent } from '@repo/svelte-table';
	import type {
		ColumnDef,
		SortingState,
		TableOptions,
		ColumnFiltersState,
		Updater,
		VisibilityState
	} from '@tanstack/table-core';
	import { getCoreRowModel, getSortedRowModel, getFilteredRowModel } from '@tanstack/table-core';
	import type { Recording } from '@repo/services/services/recordings-db';

	const columns: ColumnDef<Recording>[] = [
		{
			accessorKey: 'id',
			header: 'ID'
		},
		{
			accessorKey: 'title',
			header: 'Title'
		},
		{
			accessorKey: 'subtitle',
			header: 'Subtitle'
		},
		{
			accessorKey: 'timestamp',
			header: 'Timestamp'
		},
		{
			accessorFn: ({ id, blob }) => ({ id, blob }),
			header: 'Blob',
			cell: ({ getValue }) => {
				const { id, blob } = getValue<{ id: string; blob: Blob }>();
				const audioUrl = URL.createObjectURL(blob);
				return renderComponent(RenderAudioUrl, { recordingId: id, audioUrl });
			}
		},
		{
			accessorFn: ({ id, transcribedText }) => ({ id, transcribedText }),
			header: 'Transcribed Text',
			cell: ({ getValue }) => {
				const { id, transcribedText } = getValue<{ id: string; transcribedText: string }>();
				return renderComponent(TranscribedText, { recordingId: id, transcribedText });
			}
		},
		{
			accessorFn: (recording) => recording,
			header: 'Actions',
			cell: ({ getValue }) => {
				const recording = getValue<Recording>();
				return renderComponent(RowActions, { recording });
			}
		}
	];

	let sorting = $state<SortingState>([
		{
			id: 'timestamp',
			desc: true
		}
	]);
	let columnFilters = $state<ColumnFiltersState>([]);
	let columnVisibility = $state<VisibilityState>({});

	function setSorting(updater: Updater<SortingState>) {
		if (updater instanceof Function) {
			sorting = updater(sorting);
		} else sorting = updater;
	}

	const table = createSvelteTable({
		get data() {
			return recordings.value;
		},
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setSorting,
		state: {
			get sorting() {
				return sorting;
			}
		},
		// TODO:
		// filters
		// visibility
		// select
		debugTable: true
	});
</script>

<svelte:head>
	<title>All Recordings</title>
</svelte:head>

<div class="container flex flex-col gap-2">
	<h1 class="scroll-m=20 text-4xl font-bold tracking-tight lg:text-5xl">Recordings</h1>
	<p class="text-muted-foreground">Your latest recordings and transcriptions</p>
	<div class="space-y-4 rounded-md border p-6">
		<!-- <div class="flex items-center gap-2">
			<Input
				class="max-w-sm"
				placeholder="Filter recordings..."
				type="text"
				bind:value={$filterValue}
			/>
			{#if $selectedRecordings.length > 0}
				<Button
					variant="outline"
					size="icon"
					on:click={() => {
						Promise.all(
							$selectedRecordings.map((recording) => {
								recordings.transcribeRecording(recording.id).pipe(Effect.runPromise);
							})
						);
					}}
				>
					{#if $selectedRecordings.some((recording) => recording?.transcriptionStatus === 'TRANSCRIBING')}
						<LoadingTranscriptionIcon />
					{:else if $selectedRecordings.some((recording) => recording?.transcriptionStatus === 'DONE')}
						<RetryTranscriptionIcon />
					{:else}
						<StartTranscriptionIcon />
					{/if}
				</Button>
				<Button
					variant="outline"
					size="icon"
					on:click={() => {
						Promise.all(
							$selectedRecordings.map((recording) => {
								recordings.deleteRecording(recording.id).pipe(Effect.runPromise);
							})
						);
					}}
				>
					<TrashIcon />
				</Button>
			{/if}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild let:builder>
					<Button variant="outline" class="ml-auto" builders={[builder]}>
						Columns <ChevronDown class="ml-2 h-4 w-4" />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					{#each flatColumns as col}
						<DropdownMenu.CheckboxItem bind:checked={idToIsVisible[col.id]}>
							{col.header}
						</DropdownMenu.CheckboxItem>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div> -->
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

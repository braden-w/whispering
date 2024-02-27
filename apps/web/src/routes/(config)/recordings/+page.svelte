<script lang="ts">
	import { recordings } from '$lib/stores/recordings';
	import { Button } from '@repo/ui/components/button';
	import * as DropdownMenu from '@repo/ui/components/dropdown-menu';
	import { Input } from '@repo/ui/components/input';
	import * as Table from '@repo/ui/components/table';
	import { Render, Subscribe, createRender, createTable } from 'svelte-headless-table';
	import {
		addTableFilter,
		addHiddenColumns,
		addSortBy,
		addSelectedRows
	} from 'svelte-headless-table/plugins';
	import ChevronDown from '~icons/heroicons/chevron-down';
	import ArrowUpDown from '~icons/lucide/arrow-up-down';
	import RenderAudioUrl from './RenderAudioUrl.svelte';
	import RowActions from './RowActions.svelte';
	import TranscribedText from './TranscribedText.svelte';
	import DataTableCheckbox from './DataTableCheckbox.svelte';
	import TranscriptionStatus from './TranscriptionStatus.svelte';

	const table = createTable(recordings, {
		hide: addHiddenColumns(),
		select: addSelectedRows(),
		sort: addSortBy(),
		filter: addTableFilter({
			fn: ({ filterValue, value }) => value.toLowerCase().includes(filterValue.toLowerCase())
		})
	});

	const columns = table.createColumns([
		table.column({
			accessor: 'id',
			header: (_, { pluginStates }) => {
				const { allPageRowsSelected } = pluginStates.select;
				return createRender(DataTableCheckbox, {
					checked: allPageRowsSelected
				});
			},
			cell: ({ row }, { pluginStates }) => {
				const { getRowState } = pluginStates.select;
				const { isSelected } = getRowState(row);

				return createRender(DataTableCheckbox, {
					checked: isSelected
				});
			},
			plugins: {
				filter: {
					exclude: true
				}
			}
		}),
		table.column({
			accessor: 'title',
			header: 'Title'
		}),
		table.column({
			accessor: 'subtitle',
			header: 'Subtitle'
		}),
		table.column({
			accessor: 'timestamp',
			header: 'Timestamp'
		}),
		table.column({
			accessor: ({ id, blob }) => ({ id, blob }),
			header: 'Blob',
			cell: ({ value: { id, blob } }) => {
				const audioUrl = URL.createObjectURL(blob);
				return createRender(RenderAudioUrl, { recordingId: id, audioUrl });
			}
		}),
		table.column({
			accessor: ({ id, transcribedText }) => ({ id, transcribedText }),
			header: 'Transcribed Text',
			cell: ({ value: { id, transcribedText } }) => {
				return createRender(TranscribedText, { recordingId: id, transcribedText });
			},
			plugins: {
				filter: {
					getFilterValue: ({ transcribedText }) => transcribedText
				}
			}
		}),
		table.column({
			accessor: (recording) => recording,
			header: 'Actions',
			cell: ({ value: recording }) => {
				return createRender(RowActions, { recording });
			}
		})
	]);
	const { headerRows, pageRows, flatColumns, pluginStates, tableAttrs, tableBodyAttrs } =
		table.createViewModel(columns);

	const { filterValue } = pluginStates.filter;
	const { hiddenColumnIds } = pluginStates.hide;
	const { selectedDataIds } = pluginStates.select;

	const DEFAULT_HIDDEN_COLUMN = [] as const;
	const ids = flatColumns.map((c) => c.id);
	let idToIsVisible: Record<string, boolean> = Object.fromEntries(
		ids.map((id) => [id, DEFAULT_HIDDEN_COLUMN.includes(id) ? false : true])
	);
	$: $hiddenColumnIds = Object.entries(idToIsVisible)
		.filter(([, hide]) => !hide)
		.map(([id]) => id);
</script>

<svelte:head>
	<title>All Recordings</title>
</svelte:head>

<div class="container flex flex-col gap-2">
	<h1 class="scroll-m=20 text-4xl font-bold tracking-tight lg:text-5xl">Recordings</h1>
	<p class="text-muted-foreground">Your latest recordings</p>
	<div class="rounded-md border p-6">
		<div class="flex items-center">
			<Input
				class="max-w-sm"
				placeholder="Filter recordings..."
				type="text"
				bind:value={$filterValue}
			/>
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
		</div>
		<Table.Root {...$tableAttrs}>
			<Table.Header>
				{#each $headerRows as headerRow}
					<Subscribe rowAttrs={headerRow.attrs()}>
						<Table.Row>
							{#each headerRow.cells as cell (cell.id)}
								<Subscribe attrs={cell.attrs()} let:attrs props={cell.props()} let:props>
									<Table.Head {...attrs} class="[&:has([role=checkbox])]:pl-3">
										<Button variant="ghost" on:click={props.sort.toggle}>
											<Render of={cell.render()} />
											<ArrowUpDown class={'ml-2 h-4 w-4'} />
										</Button>
									</Table.Head>
								</Subscribe>
							{/each}
						</Table.Row>
					</Subscribe>
				{/each}
			</Table.Header>
			<Table.Body {...$tableBodyAttrs}>
				{#each $pageRows as row (row.id)}
					<Subscribe rowAttrs={row.attrs()} let:rowAttrs>
						<Table.Row {...rowAttrs} data-state={$selectedDataIds[row.id] && 'selected'}>
							{#each row.cells as cell (cell.id)}
								<Subscribe attrs={cell.attrs()} let:attrs>
									{#if cell.id === 'id'}
										<Table.Cell {...attrs} class="text-left">
											<Render of={cell.render()} />
										</Table.Cell>
									{:else}
										<Table.Cell {...attrs} class="text-center">
											<Render of={cell.render()} />
										</Table.Cell>
									{/if}
								</Subscribe>
							{/each}
						</Table.Row>
					</Subscribe>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>

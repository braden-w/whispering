<script lang="ts">
	import { recordings } from '$lib/stores/recordings';
	import { Button } from '@repo/ui/components/button';
	import * as DropdownMenu from '@repo/ui/components/dropdown-menu';
	import { Input } from '@repo/ui/components/input';
	import * as Table from '@repo/ui/components/table';
	import { Effect } from 'effect';
	import { Render, Subscribe, createRender, createTable } from 'svelte-headless-table';
	import {
		addHiddenColumns,
		addSelectedRows,
		addSortBy,
		addTableFilter
	} from 'svelte-headless-table/plugins';
	import ChevronDown from '~icons/heroicons/chevron-down';
	import TrashIcon from '~icons/heroicons/trash';
	import ArrowDown from '~icons/lucide/arrow-down';
	import ArrowUp from '~icons/lucide/arrow-up';
	import ArrowUpDown from '~icons/lucide/arrow-up-down';
	import DataTableCheckbox from './DataTableCheckbox.svelte';
	import RenderAudioUrl from './RenderAudioUrl.svelte';
	import RowActions from './RowActions.svelte';
	import TranscribedText from './TranscribedText.svelte';

	const table = createTable(recordings, {
		hide: addHiddenColumns(),
		select: addSelectedRows(),
		sort: addSortBy({
			initialSortKeys: [
				{
					id: 'timestamp',
					order: 'desc'
				}
			]
		}),
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
				},
				sort: {
					disable: true
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
					getFilterValue: ({ transcribedText }) => {
						return transcribedText;
					}
				},
				sort: {
					getSortValue: ({ transcribedText }) => {
						return transcribedText;
					}
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
	const {
		headerRows,
		pageRows,
		flatColumns: [selectColumn, ...flatColumns],
		pluginStates,
		tableAttrs,
		tableBodyAttrs
	} = table.createViewModel(columns);

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
			<Button
				variant="outline"
				on:click={() => {
					Promise.all(
						Object.keys($selectedDataIds).map((id) => {
							/** The id is a string, but its number form is the position of the recording in the array */
							const position = Number(id);
							const correspondingRecording = $recordings[position];
							recordings.deleteRecording(correspondingRecording.id).pipe(Effect.runPromise);
						})
					);
				}}
			>
				<TrashIcon />
			</Button>
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
										{#if props.sort.disabled}
											<Render of={cell.render()} />
										{:else}
											<Button
												variant="ghost"
												on:click={(e) => {
													props.sort.toggle(e);
													props.sort.order = props.sort.order;
												}}
											>
												<Render of={cell.render()} />
												{#if props.sort.order === 'asc'}
													<ArrowUp class="ml-2 h-4 w-4" />
												{:else if props.sort.order === 'desc'}
													<ArrowDown class="ml-2 h-4 w-4" />
												{:else}
													<ArrowUpDown class="ml-2 h-4 w-4" />
												{/if}
											</Button>
										{/if}
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

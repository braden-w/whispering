<script lang="ts">
	import { recorder } from '$lib/stores/recorder';
	import { recordings } from '$lib/stores/recordings';
	import { Button } from '@repo/ui/components/button';
	import * as DropdownMenu from '@repo/ui/components/dropdown-menu';
	import { Input } from '@repo/ui/components/input';
	import { toast } from '@repo/ui/components/sonner';
	import * as Table from '@repo/ui/components/table';
	import { Effect } from 'effect';
	import { Render, Subscribe, createRender, createTable } from 'svelte-headless-table';
	import { addHiddenColumns } from 'svelte-headless-table/plugins';
	import { derived } from 'svelte/store';
	import ChevronDown from '~icons/heroicons/chevron-down';
	import RenderAudioUrl from './RenderAudioUrl.svelte';
	import RowActions from './RowActions.svelte';

	function handleKeyDown(event: KeyboardEvent) {
		if (event.code !== 'Space') return;
		event.preventDefault(); // Prevent scrolling
		recorder.toggleRecording.pipe(Effect.runPromise).catch(console.error);
	}

	const latestAudioSrc = derived(recordings, ($recordings) => {
		const latestRecording = $recordings[$recordings.length - 1];
		return latestRecording ? URL.createObjectURL(latestRecording.blob) : '';
	});
	let outputText: string;

	recordings.subscribe((newRecordings) => {
		const latestRecording = newRecordings[newRecordings.length - 1];
		if (latestRecording) {
			outputText = latestRecording.transcribedText;
		}
	});

	async function copyOutputText() {
		if (!outputText) return;
		// await writeTextToClipboard(outputText);
		toast.success('Copied to clipboard!');
	}

	const table = createTable(recordings, {
		hide: addHiddenColumns()
	});

	const columns = table.createColumns([
		table.column({
			accessor: 'id',
			header: 'ID'
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
			accessor: ({ blob }) => blob,
			header: 'Blob',
			cell: ({ value: blob }) => {
				const audioUrl = URL.createObjectURL(blob);
				return createRender(RenderAudioUrl, { audioUrl });
			}
		}),
		table.column({
			accessor: 'transcribedText',
			header: 'Transcribed Text'
		}),
		table.column({
			accessor: 'state',
			header: 'State'
		}),
		table.column({
			accessor: ({ id }) => id,
			header: 'Actions',
			cell: ({ value: id }) => {
				return createRender(RowActions, { id });
			}
		})
	]);
	const { headerRows, pageRows, flatColumns, pluginStates, tableAttrs, tableBodyAttrs } =
		table.createViewModel(columns);

	const { hiddenColumnIds } = pluginStates.hide;
	$: $hiddenColumnIds = Object.entries(hideForId)
		.filter(([, hide]) => !hide)
		.map(([id]) => id);

	const ids = flatColumns.map((c) => c.id);
	let hideForId: Record<string, boolean> = Object.fromEntries(ids.map((id) => [id, true]));
</script>

<div class="flex flex-col gap-2">
	<h1
		class="scroll-m=20 text-4xl font-bold tracking-tight lg:text-5xl"
		style="view-transition-name: recording"
	>
		Recordings
	</h1>
	<p class="text-muted-foreground">Your latest recordings</p>
	<div class="rounded-md border p-6">
		<div class="flex items-center">
			<Input class="max-w-sm" placeholder="Filter emails..." type="text" />
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild let:builder>
					<Button variant="outline" class="ml-auto" builders={[builder]}>
						Columns <ChevronDown class="ml-2 h-4 w-4" />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					{#each flatColumns as col}
						<DropdownMenu.CheckboxItem bind:checked={hideForId[col.id]}>
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
								<Subscribe attrs={cell.attrs()} let:attrs props={cell.props()}>
									<Table.Head {...attrs}>
										<Render of={cell.render()} />
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
						<Table.Row {...rowAttrs}>
							{#each row.cells as cell (cell.id)}
								<Subscribe attrs={cell.attrs()} let:attrs>
									<Table.Cell {...attrs}>
										<Render of={cell.render()} />
									</Table.Cell>
								</Subscribe>
							{/each}
						</Table.Row>
					</Subscribe>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>

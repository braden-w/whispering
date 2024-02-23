<script lang="ts">
	import { recorder } from '$lib/stores/recorder';
	import { recordings } from '$lib/stores/recordings';
	import { Button } from '@repo/ui/components/button';
	import * as Collapsible from '@repo/ui/components/collapsible';
	import * as DropdownMenu from '@repo/ui/components/dropdown-menu';
	import { Input } from '@repo/ui/components/input';
	import { Label } from '@repo/ui/components/label';
	import { toast } from '@repo/ui/components/sonner';
	import * as Table from '@repo/ui/components/table';
	import { Effect } from 'effect';
	import { Render, Subscribe, createRender, createTable } from 'svelte-headless-table';
	import { addHiddenColumns } from 'svelte-headless-table/plugins';
	import KeyboardIcon from '~icons/fa6-regular/keyboard';
	import AdjustmentsHorizontalIcon from '~icons/heroicons/adjustments-horizontal';
	import ChevronDown from '~icons/heroicons/chevron-down';
	import ClipboardIcon from '~icons/heroicons/clipboard';
	import KeyIcon from '~icons/heroicons/key';
	import RenderAudioUrl from './RenderAudioUrl.svelte';
	import RowActions from './RowActions.svelte';
	import { derived } from 'svelte/store';

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
			outputText = latestRecording.transcription;
		}
	});

	async function copyOutputText() {
		if (!outputText) return;
		// await writeTextToClipboard(outputText);
		toast.success('Copied to clipboard!');
	}

	// $: recordingIdToAudioUrl = Object.fromEntries(
	// 	$recordings.map((recording) => [recording.id, URL.createObjectURL(recording.blob)])
	// );

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
			accessor: 'transcription',
			header: 'Transcription'
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

<svelte:window on:keydown={handleKeyDown} />

<div class="flex flex-col items-center justify-center gap-8 text-center">
	<div class="flex flex-col gap-4">
		<h1 class="scroll-m=20 text-4xl font-bold tracking-tight lg:text-5xl">Start recording</h1>
		<p class="text-muted-foreground">
			Click the record button to start. Allow access to your microphone.
		</p>
	</div>
	<Button
		class="transform p-12 text-8xl hover:scale-110 focus:scale-110"
		on:click={() => recorder.toggleRecording.pipe(Effect.runPromise).catch(console.error)}
		aria-label="Toggle recording"
		variant="ghost"
	>
		<span style="filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5));">
			{#if $recorder === 'RECORDING'}
				🟥
			{:else if $recorder === 'SAVING'}
				🔄
			{:else}
				🎙️
			{/if}
		</span>
	</Button>
	<Label for="transcripted-text" class="sr-only mb-2 block">Transcribed Text</Label>
	<Collapsible.Root>
		<div class="flex items-center gap-2">
			<Input
				id="transcripted-text"
				class="w-64"
				placeholder="Transcribed text will appear here..."
				bind:value={outputText}
			/>
			<Button
				class="border-primary border px-4 py-2"
				on:click={copyOutputText}
				aria-label="Copy transcribed text"
			>
				<ClipboardIcon />
			</Button>
			<Collapsible.Trigger asChild let:builder>
				<Button builders={[builder]} variant="outline">Recordings</Button>
			</Collapsible.Trigger>
		</div>
		<Collapsible.Content>
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
		</Collapsible.Content>
	</Collapsible.Root>
	{#if $latestAudioSrc}
		<audio src={$latestAudioSrc} controls class="mt-2 h-8 w-full" />
	{/if}

	<div class="flex flex-col items-center justify-center gap-2">
		<p class="text-foreground/75 text-sm leading-6">
			Click the microphone or press <kbd
				class="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
			>
				space
			</kbd> to start recording.
		</p>
		<p class="text-muted-foreground text-sm font-light">
			Check out the <Button
				href="https://chrome.google.com/webstore/detail/whispering/oilbfihknpdbpfkcncojikmooipnlglo?hl=en&authuser=0"
				variant="link"
				class="h-fit px-0.5 py-0"
				target="_blank"
				rel="noopener noreferrer"
				title="Check out the Chrome Extension"
				aria-label="Check out the Chrome Extension"
			>
				extension
			</Button> and <Button
				href="https://github.com/braden-w/whispering/releases"
				variant="link"
				class="h-fit px-0.5 py-0"
				target="_blank"
				rel="noopener noreferrer"
				title="Check out the desktop app"
				aria-label="Check out the desktop app"
			>
				app
			</Button> for shortcuts.
		</p>
	</div>
	<div class="flex gap-2">
		<Button href="/settings" aria-label="Settings" variant="secondary" size="icon">
			<AdjustmentsHorizontalIcon />
		</Button>
		<Button href="/key" aria-label="API Key" variant="secondary" size="icon">
			<KeyIcon />
		</Button>
		<Button href="/shortcut" aria-label="Keyboard Shortcuts" variant="secondary" size="icon">
			<KeyboardIcon />
		</Button>
	</div>
</div>

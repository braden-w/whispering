<script lang="ts">
	import { ClipboardIcon } from '$lib/components/icons';
	import NavItems from '$lib/components/NavItems.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { recorder, recordings, settings } from '$lib/stores';
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';

	const PLACEHOLDER_RECORDING = {
		id: '',
		title: '',
		subtitle: '',
		timestamp: '',
		blob: undefined,
		transcribedText: '',
		transcriptionStatus: 'UNPROCESSED',
	} as const;

	const latestRecording = $derived(
		recordings.value[recordings.value.length - 1] ?? PLACEHOLDER_RECORDING,
	);

	const maybeLatestAudioSrc = $derived(
		latestRecording.blob ? URL.createObjectURL(latestRecording.blob) : undefined,
	);

	const copyRecordingTextFromLatestRecording = () => recordings.copyRecordingText(latestRecording);
</script>

<svelte:head>
	<title>Whispering</title>
</svelte:head>

<div class="flex flex-col items-center justify-center gap-2 text-center">
	<div class="xs:flex hidden flex-col gap-4">
		<h1 class="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">Start recording</h1>
		<p class="text-muted-foreground">
			Click the <span style="view-transition-name: microphone-icon">🎙</span> button to start. Allow
			access to your microphone.
		</p>
	</div>
	<div class="flex flex-col items-center justify-center gap-2">
		<div class="relative">
			<Button
				class="transform px-4 py-16 text-8xl hover:scale-110 focus:scale-110"
				on:click={recorder.toggleRecording}
				aria-label="Toggle recording"
				variant="ghost"
			>
				<span style="filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5));">
					{#if recorder.recorderState === 'RECORDING'}
						🔲
					{:else}
						🎙️
					{/if}
				</span>
			</Button>
			{#if recorder.recorderState === 'RECORDING'}
				<Button
					class="absolute -right-16 bottom-1.5 transform text-2xl hover:scale-110 focus:scale-110"
					on:click={recorder.cancelRecording}
					aria-label="Cancel recording"
					size="icon"
					variant="ghost"
				>
					🚫
				</Button>
			{/if}
		</div>

		<div class="xs:flex hidden flex-col items-center justify-center gap-2">
			<div class="flex items-center gap-2">
				<Label for="transcribed-text" class="sr-only">Transcribed Text</Label>
				<Input
					id="transcribed-text"
					class="w-64"
					placeholder="Transcribed text will appear here..."
					style="view-transition-name: {createRecordingViewTransitionName({
						recordingId: latestRecording.id,
						propertyName: 'transcribedText',
					})}"
					readonly
					value={latestRecording.transcriptionStatus === 'TRANSCRIBING'
						? '...'
						: latestRecording.transcribedText}
				/>
				<Button
					class="dark:bg-secondary dark:text-secondary-foreground px-4 py-2"
					on:click={copyRecordingTextFromLatestRecording}
					style="view-transition-name: {createRecordingViewTransitionName({
						recordingId: latestRecording.id,
						propertyName: 'transcribedText',
					})}-copy-button"
				>
					<ClipboardIcon class="h-6 w-6" />
					<span class="sr-only">Copy transcribed text</span>
				</Button>
			</div>
			{#if maybeLatestAudioSrc}
				{@const latestAudioSrc = maybeLatestAudioSrc}
				<audio
					style="view-transition-name: {createRecordingViewTransitionName({
						recordingId: latestRecording.id,
						propertyName: 'blob',
					})}"
					src={latestAudioSrc}
					controls
					class="h-8 w-full"
				/>
			{/if}
			<NavItems />
		</div>
	</div>

	<div class="hidden flex-col items-center justify-center gap-1 sm:flex">
		<p class="text-foreground/75 text-sm">
			Click the microphone or press
			{' '}<Button
				href="/settings#local-shortcut"
				aria-label="Go to local shortcut in settings"
				title="Go to local shortcut in settings"
				variant="link"
				class="px-0.5"
			>
				<kbd
					class="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
				>
					{settings.currentLocalShortcut}
				</kbd>
			</Button>{' '}
			to start recording here.
		</p>
		{#if window.__TAURI__}
			<p class="text-foreground/75 pb-1 text-sm">
				Press
				{' '}<Button
					href="/settings#global-shortcut"
					aria-label="Go to global shortcut in settings"
					title="Go to global shortcut in settings"
					variant="link"
					class="px-0.5"
				>
					<kbd
						class="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
					>
						{settings.currentGlobalShortcut}
					</kbd>
				</Button>{' '}
				to start recording anywhere.
			</p>
		{/if}
		<p class="text-muted-foreground text-sm font-light">
			Check out the {' '}<Button
				href="https://chromewebstore.google.com/detail/whispering/oilbfihknpdbpfkcncojikmooipnlglo"
				variant="link"
				class="h-fit px-0.5 py-0"
				target="_blank"
				rel="noopener noreferrer"
				title="Check out the Chrome Extension"
				aria-label="Check out the Chrome Extension"
			>
				extension
			</Button>{' '}
			{#if !window.__TAURI__}
				and {' '}<Button
					href="https://github.com/braden-w/whispering/releases"
					variant="link"
					class="h-fit px-0.5 py-0"
					target="_blank"
					rel="noopener noreferrer"
					title="Check out the desktop app"
					aria-label="Check out the desktop app"
				>
					app
				</Button>{' '}
			{/if} for more integrations!
		</p>
	</div>
</div>

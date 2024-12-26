<script lang="ts">
	import CancelOrEndRecordingSessionButton from '$lib/components/CancelOrEndRecordingSessionButton.svelte';
	import NavItems from '$lib/components/NavItems.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { ClipboardIcon } from '$lib/components/icons';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { recordings, type Recording } from '$lib/services/db';
	import { recorder } from '$lib/stores/recorder.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import { Loader2Icon } from 'lucide-svelte';
	import { copyRecordingText } from './(config)/recordings/recordingMutations';
	import { onDestroy } from 'svelte';

	const latestRecording = $derived<Recording>(
		recordings.recordings.at(-1) ?? {
			id: '',
			title: '',
			subtitle: '',
			timestamp: '',
			blob: new Blob(),
			transcribedText: '',
			transcriptionStatus: 'UNPROCESSED',
		},
	);

	let latestAudioSrc = $state<string | undefined>(undefined);

	$effect(() => {
		if (latestRecording.blob) {
			const newUrl = URL.createObjectURL(latestRecording.blob);
			// Cleanup old URL before creating new one
			if (latestAudioSrc) {
				URL.revokeObjectURL(latestAudioSrc);
			}
			latestAudioSrc = newUrl;
		}
	});

	onDestroy(() => {
		if (latestAudioSrc) {
			URL.revokeObjectURL(latestAudioSrc);
		}
	});

	const recorderStateAsIcon = $derived(
		recorder.recorderState === 'SESSION+RECORDING' ? '🔲' : '🎙️',
	);
</script>

<svelte:head>
	<title>Whispering</title>
</svelte:head>

<main class="flex flex-1 flex-col items-center justify-center gap-4">
	<div class="xs:flex hidden flex-col items-center gap-4">
		<h1 class="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
			Start recording
		</h1>
		<p class="text-muted-foreground text-center">
			Click the 🎙 button to start. Allow access to your microphone.
		</p>
	</div>

	<div class="relative">
		<WhisperingButton
			tooltipContent="Toggle recording"
			onclick={recorder.toggleRecording}
			variant="ghost"
			class="h-full w-full transform items-center justify-center overflow-hidden duration-300 ease-in-out hover:scale-110 focus:scale-110"
		>
			<span
				style="filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5)); view-transition-name: microphone-icon;"
				class="text-[100px] leading-none"
			>
				{recorderStateAsIcon}
			</span>
		</WhisperingButton>
		<CancelOrEndRecordingSessionButton
			class="absolute -right-14 bottom-0 transform text-2xl hover:scale-110 focus:scale-110"
		/>
	</div>

	<div class="xxs:flex hidden w-full max-w-80 flex-col items-center gap-2">
		<div class="flex w-full items-center gap-2">
			<Label for="transcribed-text" class="sr-only">Transcribed Text</Label>
			<Input
				id="transcribed-text"
				class="w-full"
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
			<WhisperingButton
				tooltipContent="Copy transcribed text"
				onclick={() => copyRecordingText(latestRecording)}
				class="dark:bg-secondary dark:text-secondary-foreground px-4 py-2"
				style="view-transition-name: {createRecordingViewTransitionName({
					recordingId: latestRecording.id,
					propertyName: 'transcribedText',
				})}-copy-button"
			>
				{#if latestRecording.transcriptionStatus === 'TRANSCRIBING'}
					<Loader2Icon class="h-6 w-6 animate-spin" />
				{:else}
					<ClipboardIcon class="h-6 w-6" />
				{/if}
			</WhisperingButton>
		</div>
		{#if latestAudioSrc}
			<audio
				style="view-transition-name: {createRecordingViewTransitionName({
					recordingId: latestRecording.id,
					propertyName: 'blob',
				})}"
				src={latestAudioSrc}
				controls
				class="h-8 w-full"
			></audio>
		{/if}
	</div>

	<NavItems class="xs:flex -mb-2.5 -mt-1 hidden" />

	<div class="xs:flex hidden flex-col items-center gap-3">
		<p class="text-foreground/75 text-center text-sm">
			Click the microphone or press
			{' '}<WhisperingButton
				tooltipContent="Go to local shortcut in settings"
				href="/settings#local-shortcut"
				variant="link"
				size="inline"
			>
				<kbd
					class="bg-muted relative rounded px-[0.3rem] py-[0.15rem] font-mono text-sm font-semibold"
				>
					{settings.value.currentLocalShortcut}
				</kbd>
			</WhisperingButton>{' '}
			to start recording here.
		</p>
		{#if window.__TAURI_INTERNALS__}
			<p class="text-foreground/75 text-sm">
				Press
				{' '}<WhisperingButton
					tooltipContent="Go to global shortcut in settings"
					href="/settings#global-shortcut"
					variant="link"
					size="inline"
				>
					<kbd
						class="bg-muted relative rounded px-[0.3rem] py-[0.15rem] font-mono text-sm font-semibold"
					>
						{settings.value.currentGlobalShortcut}
					</kbd>
				</WhisperingButton>{' '}
				to start recording anywhere.
			</p>
		{/if}
		<p class="text-muted-foreground text-center text-sm font-light">
			Check out the {' '}<WhisperingButton
				tooltipContent="Check out the Chrome Extension"
				href="https://chromewebstore.google.com/detail/whispering/oilbfihknpdbpfkcncojikmooipnlglo"
				target="_blank"
				rel="noopener noreferrer"
				variant="link"
				size="inline"
			>
				extension
			</WhisperingButton>{' '}
			{#if !window.__TAURI_INTERNALS__}
				and {' '}<WhisperingButton
					tooltipContent="Check out the desktop app"
					href="https://github.com/braden-w/whispering/releases"
					target="_blank"
					rel="noopener noreferrer"
					variant="link"
					size="inline"
				>
					app
				</WhisperingButton>{' '}
			{/if} for more integrations!
		</p>
	</div>
</main>

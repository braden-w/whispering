<script lang="ts">
	import { ClipboardIcon, Minimize2Icon } from '$lib/components/icons';
	import NavItems from '$lib/components/NavItems.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { recorder, recordings, settings } from '$lib/stores';
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import { appWindow, LogicalSize } from '@tauri-apps/api/window';

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

<div class="flex-col items-center justify-center gap-2 text-center">
	<div class="xs:block hidden flex-col gap-4">
		<h1 class="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">Start recording</h1>
		<p class="text-muted-foreground">
			Click the <span style="view-transition-name: microphone-icon">🎙</span> button to start. Allow
			access to your microphone.
		</p>
	</div>
	<div class="flex flex-col items-center justify-center gap-2">
		<div class="relative">
			<WhisperingButton
				tooltipText="Toggle recording"
				onclick={recorder.toggleRecording}
				variant="ghost"
				class="h-full w-full transform items-center justify-center overflow-hidden duration-300 ease-in-out hover:scale-110 focus:scale-110"
			>
				<span
					style="filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5));"
					class="text-[100px] leading-none"
				>
					{#if recorder.recorderState === 'RECORDING'}
						🔲
					{:else}
						🎙️
					{/if}
				</span>
			</WhisperingButton>
			{#if recorder.recorderState === 'RECORDING'}
				<WhisperingButton
					tooltipText="Cancel recording"
					onclick={recorder.cancelRecording}
					variant="ghost"
					size="icon"
					class="absolute -right-16 bottom-1.5 transform text-2xl hover:scale-110 focus:scale-110"
				>
					🚫
				</WhisperingButton>
			{/if}
		</div>

		<div class="xxs:flex hidden flex-col items-center justify-center gap-2">
			<div class="flex items-center gap-2">
				<Label for="transcribed-text" class="sr-only">Transcribed Text</Label>
				<Input
					id="transcribed-text"
					class="max-w-64 w-full"
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
					tooltipText="Copy transcribed text"
					onclick={copyRecordingTextFromLatestRecording}
					class="dark:bg-secondary dark:text-secondary-foreground px-4 py-2"
					style="view-transition-name: {createRecordingViewTransitionName({
						recordingId: latestRecording.id,
						propertyName: 'transcribedText',
					})}-copy-button"
				>
					<ClipboardIcon class="h-6 w-6" />
				</WhisperingButton>
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
			<NavItems class="xs:flex hidden">
				{#if window.__TAURI__}
					<WhisperingButton
						tooltipText="Minimize"
						onclick={() => {
							appWindow.setSize(new LogicalSize(72, 84));
						}}
						variant="ghost"
						size="icon"
					>
						<Minimize2Icon class="h-4 w-4" aria-hidden="true" />
					</WhisperingButton>
				{/if}
			</NavItems>
		</div>
	</div>

	<div class="xs:flex hidden flex-col items-center justify-center gap-1">
		<p class="text-foreground/75 text-sm">
			Click the microphone or press
			{' '}<WhisperingButton
				tooltipText="Go to local shortcut in settings"
				href="/settings#local-shortcut"
				variant="link"
				class="px-0.5"
			>
				<kbd
					class="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
				>
					{settings.currentLocalShortcut}
				</kbd>
			</WhisperingButton>{' '}
			to start recording here.
		</p>
		{#if window.__TAURI__}
			<p class="text-foreground/75 pb-1 text-sm">
				Press
				{' '}<WhisperingButton
					tooltipText="Go to global shortcut in settings"
					href="/settings#global-shortcut"
					variant="link"
					class="px-0.5"
				>
					<kbd
						class="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
					>
						{settings.currentGlobalShortcut}
					</kbd>
				</WhisperingButton>{' '}
				to start recording anywhere.
			</p>
		{/if}
		<p class="text-muted-foreground text-sm font-light">
			Check out the {' '}<WhisperingButton
				tooltipText="Check out the Chrome Extension"
				href="https://chromewebstore.google.com/detail/whispering/oilbfihknpdbpfkcncojikmooipnlglo"
				target="_blank"
				rel="noopener noreferrer"
				variant="link"
				class="h-fit px-0.5 py-0"
			>
				extension
			</WhisperingButton>{' '}
			{#if !window.__TAURI__}
				and {' '}<WhisperingButton
					tooltipText="Check out the desktop app"
					href="https://github.com/braden-w/whispering/releases"
					target="_blank"
					rel="noopener noreferrer"
					variant="link"
					class="h-fit px-0.5 py-0"
				>
					app
				</WhisperingButton>{' '}
			{/if} for more integrations!
		</p>
	</div>
</div>

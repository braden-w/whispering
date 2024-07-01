<script lang="ts">
	import NavItems from '$lib/components/NavItems.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { ClipboardIcon } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { mediaStream } from '$lib/services/MediaRecorderService.svelte';
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

	let isAboutRecordingSessionDialogOpen = $state(false);
</script>

<svelte:head>
	<title>Whispering</title>
</svelte:head>

<main class="flex flex-1 flex-col items-center justify-center gap-4">
	<div class="xs:flex hidden flex-col items-center gap-4">
		<h1 class="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">Start recording</h1>
		<p class="text-muted-foreground line-clamp-1">
			Click the 🎙 button to start. Allow access to your microphone.
		</p>
	</div>

	<div class="relative">
		<WhisperingButton
			tooltipText="Toggle recording"
			onclick={() => recorder.toggleRecording(settings)}
			variant="ghost"
			class="h-full w-full transform items-center justify-center overflow-hidden duration-300 ease-in-out hover:scale-110 focus:scale-110"
		>
			<span
				style="filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5)); view-transition-name: microphone-icon"
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
				onclick={() => recorder.cancelRecording(settings)}
				variant="ghost"
				size="icon"
				class="absolute -right-14 bottom-0 transform text-2xl hover:scale-110 focus:scale-110"
			>
				🚫
			</WhisperingButton>
		{:else if mediaStream.isStreamOpen}
			<Tooltip.Root>
				<Tooltip.Trigger asChild let:builder>
					<Button
						builders={[builder]}
						onclick={mediaStream.destroy}
						variant="ghost"
						size="icon"
						class="absolute -right-14 bottom-0 transform text-2xl hover:scale-110 focus:scale-110"
					>
						<span class="sr-only">End recording session</span>
						🔴
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>
					End recording session
					<Button
						variant="link"
						class="h-fit px-0.5 py-0"
						on:click={() => (isAboutRecordingSessionDialogOpen = true)}
					>
						(What's that?)
					</Button>
				</Tooltip.Content>
			</Tooltip.Root>
			<Dialog.Root bind:open={isAboutRecordingSessionDialogOpen}>
				<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Header>
						<Dialog.Title>About recording sessions</Dialog.Title>
						<Dialog.Description>Faster re-recording explained</Dialog.Description>
					</Dialog.Header>
					<p>
						Whispering keeps the media stream open after you start recording, enabling quick
						re-recording with reduced latency.
					</p>
					<p>This means your computer will show this tab is still using the microphone.</p>
					<p>When finished, click the 🔴 button to close the stream and end microphone access.</p>
				</Dialog.Content>
			</Dialog.Root>
		{/if}
	</div>

	<div class="xxs:flex max-w-80 hidden w-full flex-col items-center gap-2">
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
	</div>

	<NavItems class="xs:flex -mb-2.5 -mt-1 hidden" />

	<div class="xs:flex hidden flex-col items-center gap-3">
		<p class="text-foreground/75 truncate text-sm">
			Click the microphone or press
			{' '}<WhisperingButton
				tooltipText="Go to local shortcut in settings"
				href="/settings#local-shortcut"
				variant="link"
				class="h-fit px-0.5 py-0"
			>
				<kbd
					class="bg-muted relative rounded px-[0.3rem] py-[0.15rem] font-mono text-sm font-semibold"
				>
					{settings.currentLocalShortcut}
				</kbd>
			</WhisperingButton>{' '}
			to start recording here.
		</p>
		{#if window.__TAURI__}
			<p class="text-foreground/75 truncate text-sm">
				Press
				{' '}<WhisperingButton
					tooltipText="Go to global shortcut in settings"
					href="/settings#global-shortcut"
					variant="link"
					class="h-fit px-0.5 py-0"
				>
					<kbd
						class="bg-muted relative rounded px-[0.3rem] py-[0.15rem] font-mono text-sm font-semibold"
					>
						{settings.currentGlobalShortcut}
					</kbd>
				</WhisperingButton>{' '}
				to start recording anywhere.
			</p>
		{/if}
		<p class="text-muted-foreground truncate text-sm font-light">
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
</main>

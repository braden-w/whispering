<script lang="ts">
	import { createRecordingViewTransitionName } from '$lib/create-view-transition-name';
	import { recorder } from '$lib/stores/recorder';
	import { recordings } from '$lib/stores/recordings';
	import { clipboard } from '$lib/system-apis/clipboard';
	import { toggleRecording } from '$lib/toggle-recording';
	import { Button } from '@repo/ui/components/button';
	import { Input } from '@repo/ui/components/input';
	import { Label } from '@repo/ui/components/label';
	import { toast } from '@repo/ui/components/sonner';
	import { Effect } from 'effect';
	import { derived } from 'svelte/store';
	import ClipboardIcon from '~icons/heroicons/clipboard';

	function handleKeyDown(event: KeyboardEvent) {
		if (event.code !== 'Space') return;
		event.preventDefault(); // Prevent scrolling
		recorder.toggleRecording.pipe(Effect.runPromise).catch(console.error);
	}

	const PLACEHOLDER_RECORDING = {
		id: '',
		title: '',
		subtitle: '',
		blob: undefined,
		transcribedText: '',
		state: 'UNPROCESSED'
	} as const;

	const latestRecording = derived(recordings, ($recordings) => {
		return $recordings[$recordings.length - 1] ?? PLACEHOLDER_RECORDING;
	});

	const latestAudioSrc = derived(latestRecording, ($latestRecording) => {
		return $latestRecording.blob ? URL.createObjectURL($latestRecording.blob) : undefined;
	});

	const copyOutputText = () =>
		Effect.gen(function* (_) {
			if (!$latestRecording.transcribedText) return;
			yield* _(clipboard.setClipboardText($latestRecording.transcribedText));
			toast.success('Copied to clipboard!');
		}).pipe(Effect.runPromise);
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="flex flex-col items-center justify-center gap-6 text-center">
	<div class="flex flex-col gap-4">
		<h1 class="scroll-m=20 text-4xl font-bold tracking-tight lg:text-5xl">
			Start <span style="view-transition-name: title-recording">recording</span>
		</h1>
		<p class="text-muted-foreground">
			Click the 🎙 button to start. Allow access to your microphone.
		</p>
	</div>
	<Button
		class="transform px-4 py-16 text-8xl hover:scale-110 focus:scale-110"
		on:click={toggleRecording}
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
	<div class="flex max-w-7xl flex-col gap-3">
		<Label for="transcribed-text" class="sr-only">Transcribed Text</Label>
		<div class="flex items-center gap-2">
			<Input
				id="transcribed-text"
				class="w-64"
				placeholder="Transcribed text will appear here..."
				style="view-transition-name: {createRecordingViewTransitionName({
					recordingId: $latestRecording.id,
					propertyName: 'transcribedText'
				})}"
				readonly
				value={$latestRecording.state === 'TRANSCRIBING' ? '...' : $latestRecording.transcribedText}
			/>
			<Button
				class="border-primary border px-4 py-2"
				on:click={copyOutputText}
				aria-label="Copy transcribed text"
			>
				<ClipboardIcon />
			</Button>
		</div>
		{#if $latestAudioSrc}
			<audio
				style="view-transition-name: {createRecordingViewTransitionName({
					recordingId: $latestRecording.id,
					propertyName: 'blob'
				})}"
				src={$latestAudioSrc}
				controls
				class="h-8 w-full"
			/>
		{/if}
	</div>

	<div class="flex flex-col items-center justify-center gap-2">
		<Button href="/recordings" variant="outline">See all recordings</Button>
		<p class="text-foreground/75 text-sm leading-6">
			Click the microphone or press
			<Button href="/shortcut" aria-label="Keyboard Shortcuts" variant="link" class="px-0.5">
				<kbd
					class="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
				>
					space
				</kbd>
			</Button> to start recording.
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
	<!-- <div class="flex gap-2">
		<Button href="/key" aria-label="API Key" variant="secondary" size="icon">
			<KeyIcon />
		</Button>
		<Button href="/shortcut" aria-label="Keyboard Shortcuts" variant="secondary" size="icon">
			<KeyboardIcon />
		</Button>
	</div> -->
</div>

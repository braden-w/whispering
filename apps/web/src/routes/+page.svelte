<script lang="ts">
	import { toggleRecording } from '$lib/recorder/toggleRecording';
	import { audioSrc, outputText, recorder, type RecorderState } from '$lib/stores/recordingState';
	import { writeTextToClipboard } from '$lib/system-apis/clipboard';
	import { Button } from '@repo/ui/components/button';
	import { Input } from '@repo/ui/components/input';
	import { Label } from '@repo/ui/components/label';
	import toast from 'svelte-french-toast';
	import KeyboardIcon from '~icons/fa6-regular/keyboard';
	import AdjustmentsHorizontalIcon from '~icons/heroicons/adjustments-horizontal';
	import ClipboardIcon from '~icons/heroicons/clipboard';
	import KeyIcon from '~icons/heroicons/key';
	import GithubIcon from '~icons/mdi/github';

	let recordingState: RecorderState = 'IDLE';
	const recordingStateToIcon = {
		IDLE: '🎙️',
		RECORDING: '🟥',
		SAVING: '🔄'
	} satisfies Record<RecorderState, string>;
	$: icon = recordingStateToIcon[recordingState];

	function handleKeyDown(event: KeyboardEvent) {
		if (event.code !== 'Space') return;
		event.preventDefault(); // Prevent scrolling
		toggleRecording();
	}

	async function copyOutputText() {
		await writeTextToClipboard($outputText);
		toast.success('Copied to clipboard!');
	}
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="flex min-h-screen flex-col items-center justify-center gap-4">
	<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">Whispering</h1>
	<Button
		class="drop-shadow-png min-h-fit min-w-fit transform p-10 text-7xl hover:scale-110 focus:scale-110"
		on:click={toggleRecording}
		aria-label="Toggle recording"
		variant="ghost"
	>
		{icon}
	</Button>
	<div>
		<Label for="transcripted-text" class="sr-only mb-2 block">Transcribed Text</Label>
		<div class="flex items-center space-x-2">
			<Input
				id="transcripted-text"
				class="w-64 rounded-lg border transition-all duration-200 ease-in-out focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
				placeholder="Transcribed text will appear here..."
				bind:value={$outputText}
			/>

			<Button
				class="rounded-lg border border-gray-600 bg-gray-600 px-4 py-2 text-white transition-all duration-200 ease-in-out hover:bg-gray-700 focus:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
				on:click={copyOutputText}
				aria-label="Copy transcribed text"
			>
				<ClipboardIcon />
			</Button>
		</div>
		{#if $audioSrc}
			<audio src={$audioSrc} controls class="mt-2 h-8 w-full" />
		{/if}
	</div>

	<div class="flex flex-col items-center justify-center gap-2">
		<p class="text-sm leading-none">
			Click the microphone or press <kbd
				class="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
			>
				space
			</kbd> to start recording.
		</p>
		<small class="text-muted-foreground text-sm font-light">
			Check out the
			<Button
				href="https://chrome.google.com/webstore/detail/whispering/oilbfihknpdbpfkcncojikmooipnlglo?hl=en&authuser=0"
				target="_blank"
				rel="noopener noreferrer"
				variant="link"
				class="px-0.5"
				title="Check out the Chrome Extension"
				aria-label="Check out the Chrome Extension"
			>
				extension
			</Button>
			and
			<Button
				href="https://github.com/braden-w/whispering/releases"
				variant="link"
				class="px-0.5"
				title="Check out the desktop app"
				aria-label="Check out the desktop app"
			>
				app
			</Button> for shortcuts.
		</small>
	</div>
	<div class="flex gap-2">
		<Button href="/settings" aria-label="Settings" variant="ghost" size="icon">
			<AdjustmentsHorizontalIcon />
		</Button>
		<Button href="/key" aria-label="API Key" variant="ghost" size="icon">
			<KeyIcon />
		</Button>
		<Button href="/shortcut" aria-label="Keyboard Shortcuts" variant="ghost" size="icon">
			<KeyboardIcon />
		</Button>
		<Button
			href="https://github.com/braden-w/whispering"
			target="_blank"
			rel="noopener noreferrer"
			title="View project on GitHub"
			aria-label="View project on GitHub"
			size="icon"
			variant="ghost"
		>
			<GithubIcon class="h-4 w-4" />
		</Button>
	</div>
</div>

<style>
	.drop-shadow-png {
		filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5));
	}
</style>

<script lang="ts">
	import { toggleRecording } from '$lib/recorder/toggleRecording';
	import Sun from '~icons/lucide/sun';
	import Moon from '~icons/lucide/moon';
	import { audioSrc, outputText, recorder, type RecorderState } from '$lib/stores/recordingState';
	import { writeTextToClipboard } from '$lib/system-apis/clipboard';
	import { Button } from '@repo/ui/components/button';
	import { Input } from '@repo/ui/components/input';
	import { Label } from '@repo/ui/components/label';
	import { toast, toggleMode } from '@repo/ui/components/sonner';
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

<div class="container flex min-h-screen flex-col items-center justify-center gap-4">
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
				class="w-64"
				placeholder="Transcribed text will appear here..."
				bind:value={$outputText}
			/>
			<Button
				class="border-primary border px-4 py-2"
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
		<p class="text-foreground/75 text-sm">
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
				variant="link"
				class="px-0.5"
				target="_blank"
				rel="noopener noreferrer"
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
				target="_blank"
				rel="noopener noreferrer"
				title="Check out the desktop app"
				aria-label="Check out the desktop app"
			>
				app
			</Button> for shortcuts.
		</small>
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
		<Button
			href="https://github.com/braden-w/whispering"
			target="_blank"
			rel="noopener noreferrer"
			title="View project on GitHub"
			aria-label="View project on GitHub"
			size="icon"
			variant="secondary"
		>
			<GithubIcon class="h-4 w-4" />
		</Button>
		<Button on:click={toggleMode} variant="secondary" size="icon">
			<Sun
				class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
			/>
			<Moon
				class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
			/>
			<span class="sr-only">Toggle theme</span>
		</Button>
	</div>
</div>

<style>
	.drop-shadow-png {
		filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5));
	}
</style>

<script lang="ts">
	import {toggleRecording} from '$lib/recorder/toggleRecording';
	import {audioSrc, isRecording, outputText} from '$lib/stores/isRecording';
	import {options} from '$lib/stores/options';
	import {writeTextToClipboard} from '$lib/system-apis/clipboard';
	import {registerShortcut, unregisterAllShortcuts} from '$lib/system-apis/shorcuts';
	import {onDestroy, onMount} from 'svelte';
	import toast from 'svelte-french-toast';
	import {ToggleRecordingIcon} from 'ui/components';
	import {ClipboardIcon} from 'ui/icons';
	import AdjustmentsHorizontalIcon from 'ui/icons/AdjustmentsHorizontalIcon.svelte';

	// --- Local Shorcuts ---

	function handleKeyDown(event: KeyboardEvent) {
		if (event.code !== 'Space') return;
		event.preventDefault(); // Prevent scrolling
		toggleRecording();
	}

	// --- Copy Output Button ---

	async function copyOutputText() {
		await writeTextToClipboard($outputText);
		toast.success('Copied to clipboard!');
	}

	// --- Store Logic ---

	onMount(async () => await registerShortcut($options.currentGlobalShortcut, toggleRecording));
	onDestroy(async () => await unregisterAllShortcuts());
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="flex min-h-screen flex-col items-center justify-center space-y-4">
	<h1 class="text-4xl font-semibold text-gray-700">Whispering</h1>

	<ToggleRecordingIcon isRecording={$isRecording} on:click={toggleRecording} />

	<div>
		<label for="transcripted-text" class="sr-only mb-2 block text-gray-700">
			Transcribed Text
		</label>
		<div class="flex items-center space-x-2">
			<input
				id="transcripted-text"
				class="w-64 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 transition-all duration-200 ease-in-out focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
				placeholder="Transcribed text will appear here..."
				bind:value={$outputText}
			/>

			<button
				class="rounded-lg border border-gray-600 bg-gray-600 px-4 py-2 text-white transition-all duration-200 ease-in-out hover:bg-gray-700 focus:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
				on:click={copyOutputText}
				aria-label="Copy transcribed text"
			>
				<ClipboardIcon />
			</button>
		</div>
		{#if $audioSrc}
			<audio src={$audioSrc} controls class="mt-2 h-8 w-full" />
		{/if}
	</div>
	<p class="text-xs text-gray-600">
		Click the microphone or press <kbd>space</kbd> to start recording.
	</p>
	{#if !window.__TAURI__}
		<p class="text-xs text-gray-600">
			Install the
			<a
				href="https://github.com/braden-w/whispering/releases"
				class="text-gray-600 underline hover:text-indigo-900"
				title="Download the desktop app"
				aria-label="Download the desktop app"
			>
				desktop app
			</a> for global shortcuts.
		</p>
	{/if}
	<a
		href="/setup"
		class="inline-flex items-center space-x-2 rounded-md border px-3 py-1 text-gray-600 hover:bg-gray-100 focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
	>
		<AdjustmentsHorizontalIcon />
		<span>Settings</span>
	</a>
	<p class="text-xs text-gray-600">
		{#if window.__TAURI__}
			or
			<button
				type="button"
				class="text-gray-600 underline hover:text-indigo-900"
				aria-label="Change your keyboard shortcut"
			>
				change your keyboard shortcut
			</button>.
		{/if}
	</p>

	<div class="fixed bottom-4 right-4">
		<a
			href="https://github.com/braden-w/whisper-desktop"
			target="_blank"
			rel="noopener noreferrer"
			class="text-gray-500 transition-colors duration-200 hover:text-gray-800"
			title="View project on GitHub"
			aria-label="View project on GitHub"
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-8 w-8">
				<path
					d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.6-.015 2.89-.015 3.29 0 .32.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
				/>
			</svg>
		</a>
	</div>
</div>

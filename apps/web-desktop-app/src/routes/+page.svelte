<script lang="ts">
	import { toggleRecording } from '$lib/recorder/toggleRecording';
	import { audioSrc, recordingState, outputText } from '$lib/stores/recordingState';
	import { writeTextToClipboard } from '$lib/system-apis/clipboard';
	import toast from 'svelte-french-toast';
	import { ToggleRecordingIcon } from 'ui/components';
	import { AdjustmentsHorizontalIcon, ClipboardIcon, KeyIcon, KeyboardIcon } from 'ui/icons';

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

<div class="flex min-h-screen flex-col items-center justify-center space-y-4">
	<h1 class="text-4xl font-semibold text-gray-700">Whispering</h1>

	<ToggleRecordingIcon recordingState={$recordingState} on:click={toggleRecording} />

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
		<p class="text-xs text-gray-500 font-light">
			Check out the
			<a
				href="https://chrome.google.com/webstore/detail/whispering/oilbfihknpdbpfkcncojikmooipnlglo?hl=en&authuser=0"
				target="_blank"
				rel="noopener noreferrer"
				class="text-gray-600 underline hover:text-indigo-900"
				title="Check out the Chrome Extension"
				aria-label="Check out the Chrome Extension"
			>
				extension
			</a>
			and
			<a
				href="https://github.com/braden-w/whispering/releases"
				class="text-gray-600 underline hover:text-indigo-900"
				title="Check out the desktop app"
				aria-label="Check out the desktop app"
			>
				app
			</a> for shortcuts.
		</p>
	{:else}
		<p class="text-xs text-gray-600">
			Check out the
			<a
				href="https://chrome.google.com/webstore/detail/whispering/oilbfihknpdbpfkcncojikmooipnlglo?hl=en&authuser=0"
				target="_blank"
				rel="noopener noreferrer"
				class="text-gray-600 underline hover:text-indigo-900"
				title="Check out the Chrome Extension"
				aria-label="Check out the Chrome Extension"
			>
				extension
			</a>

			for browser integration.
		</p>
	{/if}
	<div class="flex">
		<a
			href="/settings"
			class="inline-flex items-center rounded-md px-3 py-1 text-gray-600 hover:bg-gray-100 focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
			aria-label="Settings"
		>
			<AdjustmentsHorizontalIcon />
		</a>
		<a
			href="/key"
			class="inline-flex items-center rounded-md px-3 py-1 text-gray-600 hover:bg-gray-100 focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
			aria-label="API Key"
		>
			<KeyIcon />
		</a>
		<a
			href="/shortcut"
			class="inline-flex items-center rounded-md px-3 py-1 text-gray-600 hover:bg-gray-100 focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
			aria-label="Keyboard Shortcuts"
		>
			<KeyboardIcon />
		</a>
	</div>

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

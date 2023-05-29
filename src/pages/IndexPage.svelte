<script lang="ts">
	import octagonalSign from 'data-base64:~assets/octagonal_sign.png';
	import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
	import toast from 'svelte-french-toast/dist/core/toast';

	import Anchor from '~lib/Anchor.svelte';
	import { writeTextToClipboard } from '~lib/apis/clipboard';
	import { startRecording, stopRecording } from '~lib/recorder/mediaRecorder';
	import { apiKey } from '~lib/stores/apiKey';
	import PleaseEnterAPIKeyToast from '~lib/toasts/PleaseEnterAPIKeyToast.svelte';
	import SomethingWentWrongToast from '~lib/toasts/SomethingWentWrongToast.svelte';
	import { transcribeAudioWithWhisperApi } from '~lib/transcribeAudioWithWhisperApi';

	// --- Recording Logic ---

	let isRecording = false;
	$: micIcon = isRecording ? '🟥' : '🎙️';
	let outputText = '';
	let audioSrc: string;

	async function toggleRecording() {
		if (!$apiKey) {
			toast.error(PleaseEnterAPIKeyToast);
			return;
		}

		if (!isRecording) {
			await startRecording();
			chrome.action.setIcon({ path: octagonalSign });
			isRecording = !isRecording;
		} else {
			const audioBlob = await stopRecording();
			audioSrc = URL.createObjectURL(audioBlob);
			chrome.action.setIcon({ path: studioMicrophone });
			isRecording = !isRecording;
			toast.promise(processRecording(audioBlob), {
				loading: 'Processing Whisper...',
				success: 'Copied to clipboard!',
				error: () => SomethingWentWrongToast
			});
		}
	}

	async function processRecording(audioBlob: Blob) {
		const text = await transcribeAudioWithWhisperApi(audioBlob, $apiKey);
		writeTextToClipboard(text);
		outputText = text;
	}

	// --- Local Shorcuts ---

	function handleKeyDown(event: KeyboardEvent) {
		if (event.code !== 'Space') return;
		event.preventDefault(); // Prevent scrolling
		toggleRecording();
	}

	// --- Copy Output Button ---

	async function copyOutputText() {
		await writeTextToClipboard(outputText);
		toast.success('Copied to clipboard!');
	}
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="flex min-h-screen flex-col items-center justify-center space-y-4">
	<h1 class="text-4xl font-semibold text-gray-700">Whispering</h1>
	<button
		class="transform text-6xl transition-transform duration-200 ease-in-out hover:scale-110"
		on:click={toggleRecording}
		type="button"
		aria-label="Toggle recording">
		{micIcon}
	</button>

	<div>
		<label for="transcripted-text" class="sr-only mb-2 block text-gray-700">
			Transcribed Text
		</label>
		<div class="flex items-center space-x-2">
			<input
				id="transcripted-text"
				class="w-64 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 transition-all duration-200 ease-in-out focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
				placeholder="Transcribed text will appear here..."
				bind:value={outputText} />

			<button
				class="rounded-lg border border-gray-600 bg-gray-600 px-4 py-2 text-white transition-all duration-200 ease-in-out hover:bg-gray-700 focus:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
				on:click={copyOutputText}
				aria-label="Copy transcribed text">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="h-6 w-6">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
				</svg>
			</button>
		</div>
		{#if audioSrc}
			<audio src={audioSrc} controls class="mt-2 h-8 w-full" />
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
				aria-label="Download the desktop app">
				desktop app
			</a> for global shortcuts.
		</p>
	{/if}
	<p class="text-xs text-gray-600">
		<Anchor href="/setup" class="text-gray-600 underline hover:text-indigo-900">
			Edit your OpenAI API Key
		</Anchor>
	</p>
	<div class="fixed bottom-4 right-4">
		<a
			href="https://github.com/braden-w/whisper-desktop"
			target="_blank"
			rel="noopener noreferrer"
			class="text-gray-500 transition-colors duration-200 hover:text-gray-800"
			title="View project on GitHub"
			aria-label="View project on GitHub">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-8 w-8">
				<path
					d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.6-.015 2.89-.015 3.29 0 .32.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
			</svg>
		</a>
	</div>
</div>

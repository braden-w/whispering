<script lang="ts">
	import { options } from '$lib/stores/options';
	import { invoke } from '@tauri-apps/api/tauri';
	$: if ($options.pasteContentsOnSuccess) invoke('paste');
</script>

<div class="flex min-h-screen flex-col items-center justify-center space-y-4">
	<h1 class="text-4xl font-semibold text-gray-700">Settings</h1>

	<div class="flex flex-col space-y-2 px-4">
		<label class="inline-flex items-center">
			<input type="checkbox" class="text-indigo-600" bind:checked={$options.copyToClipboard} />
			<span class="ml-2 text-gray-600 font-light">
				Copy text to clipboard on successful transcription
			</span>
		</label>
		<label class="inline-flex items-center">
			<input
				type="checkbox"
				class="text-indigo-600"
				bind:checked={$options.pasteContentsOnSuccess}
			/>
			<span class="ml-2 text-gray-600 font-light">
				Paste contents from clipboard after successful transcription (experimental)
			</span>
		</label>
	</div>

	<p class="text-xs text-gray-600">
		<a href="/" class="text-gray-600 underline hover:text-indigo-900"> Go back </a>
	</p>
</div>

<script lang="ts">
	import { toggleRecording } from '$lib/recorder/toggleRecording';
	import { options } from '$lib/stores/options';
	import { registerShortcut } from '$lib/system-apis/shorcuts';
	import toast from 'svelte-french-toast';

	function onChangeShortcutClick() {
		toast.promise(registerShortcut($options.currentGlobalShortcut, toggleRecording), {
			loading: 'Registering shortcuts...',
			success: 'Registered shortcuts!',
			error: "Couldn't register shortcut. The shortcut code must be a valid keyboard shortcut."
		});
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center space-y-4">
	<h1 class="text-4xl font-semibold text-gray-700">Change Your Keyboard Shortcut</h1>
	<div>
		<label for="shortcut-input" class="sr-only mb-2 block text-gray-700">
			New Keyboard Shortcut
		</label>
		<div class="flex items-center space-x-2">
			<input
				id="shortcut-input"
				class="w-64 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
				bind:value={$options.currentGlobalShortcut}
				placeholder="Enter new shortcut (e.g. CmdOrControl+Q)"
			/>
			<button
				type="button"
				class="rounded-md border border-gray-600 bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 focus:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
				on:click={onChangeShortcutClick}
				aria-label="Change keyboard shortcut"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="h-6 w-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
					/>
				</svg>
			</button>
		</div>
	</div>
	<p class="text-xs text-gray-600">
		Valid keyboard shortcuts can be found
		<a
			href="https://www.electronjs.org/docs/latest/api/accelerator#available-modifiers"
			target="_blank"
			rel="noopener noreferrer"
			class="text-gray-600 underline hover:text-indigo-900"
			title="View Electron Accelerator documentation"
			aria-label="View Electron Accelerator documentation"
		>
			here
		</a>.
	</p>

	<p class="text-xs text-gray-600">
		<a href="/" class="text-gray-600 underline hover:text-indigo-900" aria-label="Go back">
			Go back
		</a>
	</p>
</div>

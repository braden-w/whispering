<script lang="ts">
	import { goto } from '$app/navigation';
	import { toggleRecording } from '$lib/recorder/toggleRecording';
	import { options } from '$lib/stores/options';
	import { registerShortcut } from '$lib/system-apis/shortcuts';
	import toast from 'svelte-french-toast';

	async function onChangeShortcutClick() {
		await toast.promise(registerShortcut($options.currentGlobalShortcut, toggleRecording), {
			loading: 'Registering shortcuts...',
			success: 'Registered shortcuts!',
			error: "Couldn't register shortcut. The shortcut code must be a valid keyboard shortcut."
		});
		goto('/');
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center space-y-4">
	<h1 class="text-4xl font-semibold text-gray-700">Change Your Keyboard Shortcut</h1>
	{#if window.__TAURI__}
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
	{:else}
		<h2 class="text-lg font-light text-gray-500">
			You can access keyboard shortcuts on the extension and desktop app.
		</h2>

		<div class="flex space-x-4">
			<a
				href="https://chrome.google.com/webstore/detail/your-extension-id"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-500"
			>
				<svg
					class="h-4 w-4 mr-1"
					version="1.1"
					id="Livello_1"
					xmlns:x="&ns_extend;"
					xmlns:i="&ns_ai;"
					xmlns:graph="&ns_graphs;"
					xmlns="http://www.w3.org/2000/svg"
					xmlns:xlink="http://www.w3.org/1999/xlink"
					x="0px"
					y="0px"
					viewBox="0 0 2225.3 1921.9"
					enable-background="new 0 0 2225.3 1921.9"
					xml:space="preserve"
				>
					<metadata>
						<sfw xmlns="&ns_sfw;">
							<slices />
							<sliceSourceBounds
								bottomLeftOrigin="true"
								height="1921.9"
								width="2225.3"
								x="0"
								y="0"
							/>
						</sfw>
					</metadata>
					<g>
						<path
							fill="#EEEEEE"
							d="M1365.5,404.7H859.8c-55.9,0-101.2-45.3-101.2-101.2c0-55.8,45.3-101.1,101.2-101.1h505.7
		c55.9,0,101.2,45.3,101.2,101.1C1466.7,359.4,1421.4,404.7,1365.5,404.7z M0,0v1770.2c0,83.4,68.3,151.7,151.7,151.7h1921.9
		c83.4,0,151.7-68.3,151.7-151.7V0H0z"
						/>
						<path
							fill="#DB4437"
							d="M1112.7,809.2c-339.2,0-637.3,175.7-808.3,441.1v671.5h468.5l339.8-588.6h856.1
		C1809.7,1022.2,1486,809.2,1112.7,809.2z"
						/>
						<path
							fill="#0F9D58"
							d="M304.1,1250.7c-96.4,149.8-152.4,328.1-152.4,519.5c0,51.6,4.1,102.3,12,151.7h531.8L304.1,1250.7z"
						/>
						<path
							fill="#FFCD40"
							d="M2073.6,1770.2c0-157.3-37.8-305.8-104.8-436.9h-856.1l339.8,588.6h609.1
		C2069.5,1872.5,2073.6,1821.8,2073.6,1770.2z"
						/>
						<path
							fill="#F1F1F1"
							d="M1112.7,1333.3c-241.3,0-436.8,195.6-436.8,436.9c0,53.4,9.6,104.5,27.1,151.7h94.8
		c-22.2-45.9-34.6-97.4-34.6-151.7c0-193.1,156.5-349.5,349.5-349.5s349.5,156.4,349.5,349.5c0,54.4-12.4,105.8-34.6,151.7h94.8
		c17.5-47.3,27.1-98.4,27.1-151.7C1549.5,1528.9,1353.9,1333.3,1112.7,1333.3z"
						/>
						<path
							fill="#4285F4"
							d="M1112.7,1420.7c-193,0-349.5,156.4-349.5,349.5c0,54.4,12.4,105.8,34.6,151.7h629.8
		c22.2-45.9,34.6-97.4,34.6-151.7C1462.1,1577.1,1305.7,1420.7,1112.7,1420.7z"
						/>
						<path
							opacity="0.05"
							fill="#212121"
							enable-background="new    "
							d="M0,0v961h2225.3V0H0z M1365.5,404.7H859.8
		c-55.9,0-101.2-45.3-101.2-101.2c0-55.8,45.3-101.1,101.2-101.1h505.8c55.9,0,101.2,45.3,101.2,101.1
		C1466.7,359.4,1421.4,404.7,1365.5,404.7z"
						/>
						<rect
							y="948.3"
							opacity="0.02"
							fill="#212121"
							enable-background="new    "
							width="2225.3"
							height="12.7"
						/>
						<rect
							y="961"
							opacity="0.05"
							fill="#FFFFFF"
							enable-background="new    "
							width="2225.3"
							height="12.7"
						/>
						<path
							opacity="0.02"
							fill="#212121"
							enable-background="new    "
							d="M0,0v12.7h2225.3V0H0z M1365.5,404.7H859.8
		c-53.7,0-97.6-42-100.8-94.8c-0.3,2.1-0.4,4.2-0.4,6.3c0,55.9,45.3,101.1,101.2,101.1h505.7c55.9,0,101.2-45.2,101.2-101.1
		c0-2.1-0.1-4.2-0.4-6.3C1463.1,362.6,1419.3,404.7,1365.5,404.7z"
						/>
						<path
							opacity="0.1"
							fill="#231F20"
							enable-background="new    "
							d="M2073.6,1909.2H151.7C68.3,1909.2,0,1841,0,1757.5v12.7
		c0,83.4,68.3,151.7,151.7,151.7h1921.9c83.4,0,151.7-68.3,151.7-151.7v-12.7C2225.3,1841,2157,1909.2,2073.6,1909.2z M859.8,202.3
		h505.7c53.7,0,97.6,42,100.8,94.8c0.1-2.1,0.4-4.2,0.4-6.3c0-55.9-45.3-101.2-101.2-101.2H859.8c-55.9,0-101.2,45.3-101.2,101.2
		c0,2.1,0.1,4.2,0.4,6.3C762.2,244.3,806,202.3,859.8,202.3z"
						/>
					</g>
				</svg>
				Chrome Extension
			</a>
			<a
				href="https://github.com/your-repo/your-project/releases"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-gray-600 hover:bg-gray-500"
			>
				<svg class="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
					<path
						fill-rule="evenodd"
						d="M8.22 2.754a.25.25 0 00-.44 0L1.698 13.132a.25.25 0 00.22.368h12.164a.25.25 0 00.22-.368L8.22 2.754zm-1.763-.707c.659-1.234 2.427-1.234 3.0860l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 2.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z"
					/>
				</svg>
				Desktop App
			</a>
		</div>
	{/if}

	<p class="text-xs text-gray-600">
		<a href="/" class="text-gray-600 underline hover:text-indigo-900" aria-label="Go back">
			Go back
		</a>
	</p>
</div>

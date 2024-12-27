<script lang="ts">
	import { goto, onNavigate } from '$app/navigation';
	import ConfirmationDialog from '$lib/components/ConfirmationDialog.svelte';
	import FasterRerecordExplainedDialog from '$lib/components/FasterRerecordExplainedDialog.svelte';
	import MoreDetailsDialog from '$lib/components/MoreDetailsDialog.svelte';
	import { recordings } from '$lib/services/db/recordings.svelte';
	import { renderErrAsToast } from '$lib/services/renderErrorAsToast';
	import { recorder } from '$lib/stores/recorder.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { extension } from '@repo/extension';
	import { getCurrentWindow } from '@tauri-apps/api/window';
	import { ModeWatcher, mode } from 'mode-watcher';
	import { onMount } from 'svelte';
	import type { ToasterProps } from 'svelte-sonner';
	import { Toaster } from 'svelte-sonner';
	import '../app.css';

	let { children } = $props();

	const setAlwaysOnTop = (value: boolean) => {
		if (!window.__TAURI_INTERNALS__) return;
		return getCurrentWindow().setAlwaysOnTop(value);
	};

	$effect(() => {
		switch (settings.value.alwaysOnTop) {
			case 'Always':
				void setAlwaysOnTop(true);
				break;
			case 'When Recording and Transcribing':
				if (
					recorder.recorderState === 'SESSION+RECORDING' ||
					recordings.isCurrentlyTranscribing
				) {
					void setAlwaysOnTop(true);
				} else {
					void setAlwaysOnTop(false);
				}
				break;
			case 'When Recording':
				if (recorder.recorderState === 'SESSION+RECORDING') {
					void setAlwaysOnTop(true);
				} else {
					void setAlwaysOnTop(false);
				}
				break;
			case 'Never':
				void setAlwaysOnTop(false);
				break;
		}
	});

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	onMount(async () => {
		window.toggleRecording = recorder.toggleRecordingWithToast;
		window.cancelRecording = recorder.cancelRecordingWithToast;
		window.goto = goto;
		if (!window.__TAURI_INTERNALS__) {
			const sendMessageToExtensionResult =
				await extension.notifyWhisperingTabReady();
			if (!sendMessageToExtensionResult.ok) {
				renderErrAsToast({
					variant: 'error',
					title: 'Error notifying extension that tab is ready',
					description: 'Error sending message to extension',
					action: {
						type: 'more-details',
						error: sendMessageToExtensionResult.error,
					},
				});
			}
			const notifyWhisperingTabReadyResult = sendMessageToExtensionResult.data;
			if (!notifyWhisperingTabReadyResult.ok) {
				renderErrAsToast({
					variant: 'error',
					title: 'Error notifying extension that tab is ready',
					description: 'Error sending message to extension',
					action: {
						type: 'more-details',
						error: notifyWhisperingTabReadyResult.error,
					},
				});
			}
		}
	});

	const TOASTER_SETTINGS = {
		position: 'bottom-right',
		richColors: true,
		duration: 5000,
		visibleToasts: 5,
	} satisfies ToasterProps;
</script>

<svelte:head>
	<title>Whispering</title>
</svelte:head>

<button
	class="xxs:hidden hover:bg-accent hover:text-accent-foreground h-screen w-screen transform duration-300 ease-in-out"
	onclick={recorder.toggleRecordingWithToast}
>
	<span
		style="filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5));"
		class="text-[48px] leading-none"
	>
		{#if recorder.recorderState === 'SESSION+RECORDING'}
			🔲
		{:else}
			🎙️
		{/if}
	</span>
</button>

<div class="xxs:flex hidden min-h-screen flex-col items-center gap-2">
	{@render children()}
</div>

<Toaster class="xs:block hidden" theme={$mode} {...TOASTER_SETTINGS} />
<ModeWatcher />
<FasterRerecordExplainedDialog />
<ConfirmationDialog />
<MoreDetailsDialog />

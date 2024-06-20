<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { Toaster } from '$lib/components/ui/sonner';
	import { sendMessageToExtension } from '$lib/sendMessageToExtension';
	import { ToastServiceDesktopLive } from '$lib/services/ToastServiceDesktopLive';
	import { ToastServiceWebLive } from '$lib/services/ToastServiceWebLive';
	import { renderErrorAsToast } from '$lib/services/errors';
	import { recorder, recorderState } from '$lib/stores';
	import { TOASTER_SETTINGS } from '@repo/shared';
	import { Effect } from 'effect';
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';
	import '../app.pcss';

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	onMount(() => {
		window.toggleRecording = recorder.toggleRecording;
		window.cancelRecording = recorder.cancelRecording;
		window.addEventListener('beforeunload', () => {
			if (recorderState.value === 'RECORDING') {
				recorderState.value = 'IDLE';
			}
		});
		Effect.gen(function* () {
			yield* sendMessageToExtension({
				name: 'external/notifyWhisperingTabReady',
				body: {  },
			});
		}).pipe(
			Effect.catchAll(renderErrorAsToast),
			Effect.provide(window.__TAURI__ ? ToastServiceDesktopLive : ToastServiceWebLive),
			Effect.runPromise,
		);
	});
</script>

<svelte:head>
	<title>Whispering</title>
</svelte:head>

<div class="relative flex min-h-screen flex-col">
	<slot />
</div>

<Toaster {...TOASTER_SETTINGS} />
<ModeWatcher />

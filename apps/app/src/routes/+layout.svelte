<script lang="ts">
	import { listen, type UnlistenFn } from '@tauri-apps/api/event';
	import { onNavigate } from '$app/navigation';
	import { sendMessageToExtension } from '$lib/sendMessageToExtension';
	import { ToastServiceLive } from '$lib/services/ToastServiceLive';
	import { renderErrorAsToast } from '$lib/services/errors';
	import { recorder, recorderState } from '$lib/stores';
	import { Effect } from 'effect';
	import { ModeWatcher, mode } from 'mode-watcher';
	import { onDestroy, onMount } from 'svelte';
	import type { ToasterProps } from 'svelte-sonner';
	import { Toaster } from 'svelte-sonner';
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

	let unlisten: UnlistenFn;

	onMount(async () => {
		window.toggleRecording = recorder.toggleRecording;
		window.cancelRecording = recorder.cancelRecording;
		window.addEventListener('beforeunload', () => {
			if (recorderState.value === 'RECORDING') {
				recorderState.value = 'IDLE';
			}
		});
		if (window.__TAURI__) {
			unlisten = await listen('toggle-recording', () => {
				recorder.toggleRecording();
			});
		} else {
			sendMessageToExtension({
				name: 'external/notifyWhisperingTabReady',
				body: {},
			}).pipe(
				Effect.catchAll(renderErrorAsToast),
				Effect.provide(ToastServiceLive),
				Effect.runPromise,
			);
		}
	});

	onDestroy(() => {
		if (window.__TAURI__) {
			unlisten();
		}
	});

	const TOASTER_SETTINGS = {
		position: 'bottom-right',
		richColors: true,
		expand: true,
		duration: 5000,
		visibleToasts: 5,
	} satisfies ToasterProps;
</script>

<svelte:head>
	<title>Whispering</title>
</svelte:head>

<div class="relative flex min-h-screen flex-col">
	<slot />
</div>

<Toaster theme={$mode} {...TOASTER_SETTINGS} />
<ModeWatcher />

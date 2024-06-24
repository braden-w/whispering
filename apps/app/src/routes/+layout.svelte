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
	import { goto } from '$app/navigation';

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
		window.goto = goto;
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

<button
	class="xxs:hidden hover:bg-accent hover:text-accent-foreground h-screen w-screen transform duration-300 ease-in-out"
	on:click={recorder.toggleRecording}
>
	<span
		style="filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5));"
		class="text-[48px] leading-none"
	>
		{#if recorder.recorderState === 'RECORDING'}
			🔲
		{:else}
			🎙️
		{/if}
	</span>
</button>

<div class="xxs:flex relative hidden min-h-screen flex-col">
	<slot />
</div>
<Toaster class="xs:block hidden" theme={$mode} {...TOASTER_SETTINGS} />
<ModeWatcher />

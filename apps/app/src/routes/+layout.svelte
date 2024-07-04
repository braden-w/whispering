<script lang="ts">
	import { goto, onNavigate } from '$app/navigation';
	import { sendMessageToExtension } from '$lib/sendMessageToExtension';
	import { renderErrorAsToast } from '$lib/services/renderErrorAsToast';
	import { recorder, recorderState, settings } from '$lib/stores';
	import { listen, type UnlistenFn } from '@tauri-apps/api/event';
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
		window.toggleRecording = () => recorder.toggleRecording(settings);
		window.cancelRecording = () => recorder.cancelRecording(settings);
		window.goto = goto;
		window.addEventListener('beforeunload', () => {
			if (recorderState.value === 'RECORDING') {
				recorderState.value = 'IDLE';
			}
		});
		if (window.__TAURI__) {
			unlisten = await listen('toggle-recording', () => recorder.toggleRecording(settings));
		} else {
			sendMessageToExtension({
				name: 'external/notifyWhisperingTabReady',
				body: {},
			}).pipe(Effect.catchAll(renderErrorAsToast), Effect.runPromise);
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

	let { children } = $props();
</script>

<svelte:head>
	<title>Whispering</title>
</svelte:head>

<button
	class="xxs:hidden hover:bg-accent hover:text-accent-foreground h-screen w-screen transform duration-300 ease-in-out"
	on:click={() => recorder.toggleRecording(settings)}
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

<div class="xxs:flex hidden min-h-screen flex-col items-center gap-2">
	{#if children}
		{@render children()}
	{/if}
</div>

<Toaster class="xs:block hidden" theme={$mode} {...TOASTER_SETTINGS} />
<ModeWatcher />

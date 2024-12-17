<script lang="ts">
import { goto, onNavigate } from '$app/navigation';
import FasterRerecordExplainedDialog from '$lib/components/FasterRerecordExplainedDialog.svelte';
import MoreDetailsDialog from '$lib/components/MoreDetailsDialog.svelte';
import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { setAlwaysOnTopToTrueIfAlwaysInSettings } from '$lib/services/AlwaysOnTopService';
import { renderErrorAsToast } from '$lib/services/renderErrorAsToast';
import { recorder, recorderState } from '$lib/stores/recorder.svelte';
import { Effect } from 'effect';
import { ModeWatcher, mode } from 'mode-watcher';
import { onMount } from 'svelte';
import type { ToasterProps } from 'svelte-sonner';
import { Toaster } from 'svelte-sonner';
import '../app.css';

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
	window.toggleRecording = recorder.toggleRecording;
	window.cancelRecording = recorder.cancelRecording;
	window.goto = goto;
	window.addEventListener('beforeunload', () => {
		if (recorderState.value === 'RECORDING') {
			recorderState.value = 'IDLE';
		}
	});
	if (!window.__TAURI_INTERNALS__) {
		sendMessageToExtension({
			name: 'whispering-extension/notifyWhisperingTabReady',
			body: {},
		}).pipe(Effect.catchAll(renderErrorAsToast), Effect.runPromise);
	}
	setAlwaysOnTopToTrueIfAlwaysInSettings();
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
	onclick={recorder.toggleRecording}
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
	<slot />
</div>

<Toaster class="xs:block hidden" theme={$mode} {...TOASTER_SETTINGS} />
<ModeWatcher />
<FasterRerecordExplainedDialog />
<MoreDetailsDialog />

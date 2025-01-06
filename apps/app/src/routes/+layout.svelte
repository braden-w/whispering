<script module lang="ts">
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	export const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				enabled: browser,
			},
		},
	});
</script>

<script lang="ts">
	import { browser } from '$app/environment';
	import { goto, onNavigate } from '$app/navigation';
	import ConfirmationDialog from '$lib/components/ConfirmationDialog.svelte';
	import FasterRerecordExplainedDialog from '$lib/components/FasterRerecordExplainedDialog.svelte';
	import MoreDetailsDialog from '$lib/components/MoreDetailsDialog.svelte';
	import NotificationLog from '$lib/components/NotificationLog.svelte';
	import { userConfiguredServices } from '$lib/services/index.js';
	import { recorder } from '$lib/stores/recorder.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { extension } from '@repo/extension';
	import { ModeWatcher, mode } from 'mode-watcher';
	import { onMount } from 'svelte';
	import type { ToasterProps } from 'svelte-sonner';
	import { Toaster } from 'svelte-sonner';
	import '../app.css';
	import { syncWindowAlwaysOnTopWithRecorderState } from './+layout/alwaysOnTop.svelte';
	import { closeToTrayIfEnabled } from './+layout/closeToTray';

	let { children } = $props();

	syncWindowAlwaysOnTopWithRecorderState();
	closeToTrayIfEnabled();

	$effect(() => {
		recorder.recorderState;
		void userConfiguredServices.db.cleanupExpiredRecordings(settings.value);
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
		window.recorder = recorder;
		window.goto = goto;
		if (!window.__TAURI_INTERNALS__) {
			const _notifyWhisperingTabReadyResult =
				await extension.notifyWhisperingTabReady(undefined);
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

<QueryClientProvider client={queryClient}>
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

	<Toaster
		offset={16}
		class="xs:block hidden"
		theme={$mode}
		{...TOASTER_SETTINGS}
	/>
	<ModeWatcher />
	<FasterRerecordExplainedDialog />
	<ConfirmationDialog />
	<MoreDetailsDialog />
	<NotificationLog />
</QueryClientProvider>

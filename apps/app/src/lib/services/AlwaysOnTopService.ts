import { settings } from '$lib/stores/settings.svelte';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Effect } from 'effect';

export const setAlwaysOnTop = (value: boolean) =>
	Effect.gen(function* () {
		if (!window.__TAURI_INTERNALS__) return;
		yield* Effect.promise(() => getCurrentWindow().setAlwaysOnTop(value));
	});

export const setAlwaysOnTopToTrueIfAlwaysInSettings = () =>
	Effect.gen(function* () {
		if (!window.__TAURI_INTERNALS__) return;
		if (settings.value.alwaysOnTop === 'Always') {
			yield* setAlwaysOnTop(true);
		} else {
			yield* setAlwaysOnTop(false);
		}
	}).pipe(Effect.runPromise);

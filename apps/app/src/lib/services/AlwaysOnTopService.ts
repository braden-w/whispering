import { settings } from '$lib/stores/settings.svelte';
import { Effect } from 'effect';

export const setAlwaysOnTop = (value: boolean) =>
	Effect.gen(function* () {
		if (!window.__TAURI__) return;
		const { appWindow } = yield* Effect.promise(() => import('@tauri-apps/api/window'));
		yield* Effect.promise(() => appWindow.setAlwaysOnTop(value));
	});

export const setAlwaysOnTopToTrueIfAlwaysInSettings = () =>
	Effect.gen(function* () {
		if (!window.__TAURI__) return;
		if (settings.value.alwaysOnTop === 'Always') {
			yield* setAlwaysOnTop(true);
		} else {
			yield* setAlwaysOnTop(false);
		}
	}).pipe(Effect.runPromise);

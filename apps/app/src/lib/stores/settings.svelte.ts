import { recorder } from '$lib/stores';
import { LOCALSTORAGE_KEYS } from '@repo/services/services/localstorage';
import { createJobQueue } from '$lib/utils/createJobQueue';
import { createPersistedState } from '$lib/utils/createPersistedState.svelte';
import {
	RegisterShortcutsDesktopLive,
	RegisterShortcutsWebLive,
} from '@repo/services/implementations/register-shortcuts';
import {
	RegisterShortcutsService,
	type RegisterShortcutsError,
} from '@repo/services/services/register-shortcuts';
import { Effect } from 'effect';
import { toast } from 'svelte-sonner';
import { z } from 'zod';

type RegisterShortcutJob = Effect.Effect<void, RegisterShortcutsError>;

const createSettings = Effect.gen(function* () {
	const registerShortcutsService = yield* RegisterShortcutsService;
	const isPlaySoundEnabled = createPersistedState({
		key: LOCALSTORAGE_KEYS.isPlaySoundEnabled,
		schema: z.boolean(),
		defaultValue: true,
	});
	const isCopyToClipboardEnabled = createPersistedState({
		key: LOCALSTORAGE_KEYS.isCopyToClipboardEnabled,
		schema: z.boolean(),
		defaultValue: true,
	});
	const isPasteContentsOnSuccessEnabled = createPersistedState({
		key: LOCALSTORAGE_KEYS.isPasteContentsOnSuccessEnabled,
		schema: z.boolean(),
		defaultValue: true,
	});
	const currentLocalShortcut = createPersistedState({
		key: LOCALSTORAGE_KEYS.currentLocalShortcut,
		schema: z.string(),
		defaultValue: registerShortcutsService.defaultLocalShortcut,
	});
	const currentGlobalShortcut = createPersistedState({
		key: LOCALSTORAGE_KEYS.currentGlobalShortcut,
		schema: z.string(),
		defaultValue: registerShortcutsService.defaultGlobalShortcut,
	});
	const apiKey = createPersistedState({
		key: LOCALSTORAGE_KEYS.apiKey,
		schema: z.string(),
		defaultValue: '',
	});
	const outputLanguage = createPersistedState({
		key: LOCALSTORAGE_KEYS.outputLanguage,
		schema: z.string(),
		defaultValue: 'en',
	});

	const jobQueue = yield* createJobQueue<RegisterShortcutJob>();
	const queueInitialSilentJob = Effect.gen(function* () {
		const initialSilentJob = Effect.gen(function* () {
			yield* registerShortcutsService.unregisterAllLocalShortcuts();
			yield* registerShortcutsService.unregisterAllGlobalShortcuts();
			yield* registerShortcutsService.registerLocalShortcut({
				shortcut: currentLocalShortcut.value,
				callback: recorder.toggleRecording,
			});
			yield* registerShortcutsService.registerGlobalShortcut({
				shortcut: currentGlobalShortcut.value,
				callback: recorder.toggleRecording,
			});
		}).pipe(Effect.catchAll(() => Effect.succeed(undefined)));
		yield* jobQueue.addJobToQueue(initialSilentJob);
	});
	queueInitialSilentJob.pipe(Effect.runPromise);

	return {
		get isPlaySoundEnabled() {
			return isPlaySoundEnabled.value;
		},
		set isPlaySoundEnabled(newValue) {
			isPlaySoundEnabled.value = newValue;
		},
		get isCopyToClipboardEnabled() {
			return isCopyToClipboardEnabled.value;
		},
		set isCopyToClipboardEnabled(newValue) {
			isCopyToClipboardEnabled.value = newValue;
		},
		get isPasteContentsOnSuccessEnabled() {
			return isPasteContentsOnSuccessEnabled.value;
		},
		set isPasteContentsOnSuccessEnabled(newValue) {
			isPasteContentsOnSuccessEnabled.value = newValue;
		},
		get currentLocalShortcut() {
			return currentLocalShortcut.value;
		},
		set currentLocalShortcut(newValue) {
			currentLocalShortcut.value = newValue;
			const queueJob = Effect.gen(function* () {
				const job = Effect.gen(function* () {
					yield* registerShortcutsService.unregisterAllLocalShortcuts();
					yield* registerShortcutsService.registerLocalShortcut({
						shortcut: currentLocalShortcut.value,
						callback: recorder.toggleRecording,
					});
					toast.success(`Local shortcut set to ${currentLocalShortcut.value}`);
				}).pipe(
					Effect.catchAll((error) => {
						error.renderAsToast();
						return Effect.succeed(undefined);
					}),
				);
				yield* jobQueue.addJobToQueue(job);
			});
			queueJob.pipe(Effect.runPromise);
		},
		get isGlobalShortcutEnabled() {
			return registerShortcutsService.isGlobalShortcutEnabled;
		},
		get currentGlobalShortcut() {
			return currentGlobalShortcut.value;
		},
		set currentGlobalShortcut(newValue) {
			currentGlobalShortcut.value = newValue;
			const queueJob = Effect.gen(function* () {
				const job = Effect.gen(function* () {
					yield* registerShortcutsService.unregisterAllGlobalShortcuts();
					yield* registerShortcutsService.registerGlobalShortcut({
						shortcut: currentGlobalShortcut.value,
						callback: recorder.toggleRecording,
					});
					toast.success(`Global shortcut set to ${currentGlobalShortcut.value}`);
				}).pipe(
					Effect.catchAll((error) => {
						error.renderAsToast();
						return Effect.succeed(undefined);
					}),
				);
				yield* jobQueue.addJobToQueue(job);
			});
			queueJob.pipe(Effect.runPromise);
		},
		get apiKey() {
			return apiKey.value;
		},
		set apiKey(newValue) {
			apiKey.value = newValue;
		},
		get outputLanguage() {
			return outputLanguage.value;
		},
		set outputLanguage(newValue) {
			outputLanguage.value = newValue;
		},
	};
});

export const settings = createSettings.pipe(
	Effect.provide(window.__TAURI__ ? RegisterShortcutsDesktopLive : RegisterShortcutsWebLive),
	Effect.runSync,
);

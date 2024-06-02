import { recorder } from '$lib/stores';
import { APP_STORAGE_KEYS } from '@repo/services/services/app-storage';
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
	const settings = createPersistedState({
		key: 'whispering-settings',
		schema: z.object({
			isPlaySoundEnabled: z.boolean(),
			isCopyToClipboardEnabled: z.boolean(),
			isPasteContentsOnSuccessEnabled: z.boolean(),
			selectedAudioInputDeviceId: z.string(),
			currentLocalShortcut: z.string(),
			currentGlobalShortcut: z.string(),
			apiKey: z.string(),
			outputLanguage: z.string(),
		}),
		defaultValue: {
			isPlaySoundEnabled: true,
			isCopyToClipboardEnabled: true,
			isPasteContentsOnSuccessEnabled: true,
			selectedAudioInputDeviceId: '',
			currentLocalShortcut: registerShortcutsService.defaultLocalShortcut,
			currentGlobalShortcut: registerShortcutsService.defaultGlobalShortcut,
			apiKey: '',
			outputLanguage: 'en',
		},
	});

	const jobQueue = yield* createJobQueue<RegisterShortcutJob>();
	const queueInitialSilentJob = Effect.gen(function* () {
		const initialSilentJob = Effect.gen(function* () {
			yield* registerShortcutsService.unregisterAllLocalShortcuts();
			yield* registerShortcutsService.unregisterAllGlobalShortcuts();
			yield* registerShortcutsService.registerLocalShortcut({
				shortcut: settings.value.currentLocalShortcut,
				callback: recorder.toggleRecording,
			});
			yield* registerShortcutsService.registerGlobalShortcut({
				shortcut: settings.value.currentGlobalShortcut,
				callback: recorder.toggleRecording,
			});
		}).pipe(Effect.catchAll(() => Effect.succeed(undefined)));
		yield* jobQueue.addJobToQueue(initialSilentJob);
	});
	queueInitialSilentJob.pipe(Effect.runPromise);

	return {
		get isPlaySoundEnabled() {
			return settings.value.isPlaySoundEnabled;
		},
		set isPlaySoundEnabled(newValue) {
			settings.value.isPlaySoundEnabled = newValue;
		},
		get isCopyToClipboardEnabled() {
			return settings.value.isCopyToClipboardEnabled;
		},
		set isCopyToClipboardEnabled(newValue) {
			settings.value.isCopyToClipboardEnabled = newValue;
		},
		get isPasteContentsOnSuccessEnabled() {
			return settings.value.isPasteContentsOnSuccessEnabled;
		},
		set isPasteContentsOnSuccessEnabled(newValue) {
			settings.value.isPasteContentsOnSuccessEnabled = newValue;
		},
		get selectedAudioInputDeviceId() {
			return settings.value.selectedAudioInputDeviceId;
		},
		set selectedAudioInputDeviceId(newValue) {
			settings.value.selectedAudioInputDeviceId = newValue;
		},
		get currentLocalShortcut() {
			return settings.value.currentLocalShortcut;
		},
		set currentLocalShortcut(newValue) {
			settings.value.currentLocalShortcut = newValue;
			const queueJob = Effect.gen(function* () {
				const job = Effect.gen(function* () {
					yield* registerShortcutsService.unregisterAllLocalShortcuts();
					yield* registerShortcutsService.registerLocalShortcut({
						shortcut: settings.value.currentLocalShortcut,
						callback: recorder.toggleRecording,
					});
					toast.success(`Local shortcut set to ${settings.value.currentLocalShortcut}`);
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
			return settings.value.currentGlobalShortcut;
		},
		set currentGlobalShortcut(newValue) {
			settings.value.currentGlobalShortcut = newValue;
			const queueJob = Effect.gen(function* () {
				const job = Effect.gen(function* () {
					yield* registerShortcutsService.unregisterAllGlobalShortcuts();
					yield* registerShortcutsService.registerGlobalShortcut({
						shortcut: settings.value.currentGlobalShortcut,
						callback: recorder.toggleRecording,
					});
					toast.success(`Global shortcut set to ${settings.value.currentGlobalShortcut}`);
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
			return settings.value.apiKey;
		},
		set apiKey(newValue) {
			settings.value.apiKey = newValue;
		},
		get outputLanguage() {
			return settings.value.outputLanguage;
		},
		set outputLanguage(newValue) {
			settings.value.outputLanguage = newValue;
		},
	};
});

export const settings = createSettings.pipe(
	Effect.provide(window.__TAURI__ ? RegisterShortcutsDesktopLive : RegisterShortcutsWebLive),
	Effect.runSync,
);

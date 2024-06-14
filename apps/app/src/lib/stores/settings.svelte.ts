import {
	RegisterShortcutsError,
	RegisterShortcutsService,
} from '$lib/services/RegisterShortcutsService';
import { RegisterShortcutsDesktopLive } from '$lib/services/RegisterShortcutsServiceDesktopLive';
import { RegisterShortcutsWebLive } from '$lib/services/RegisterShortcutsServiceWebLive';
import { renderErrorAsToast } from '$lib/services/errors';
import { recorder } from '$lib/stores';
import { createJobQueue } from '$lib/utils/createJobQueue';
import { createPersistedState } from '$lib/utils/createPersistedState.svelte';
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
			toast: z.object({
				position: z.enum([
					'top-left',
					'top-right',
					'bottom-left',
					'bottom-right',
					'top-center',
					'bottom-center',
				]),
				richColors: z.boolean(),
				expand: z.boolean(),
				duration: z.number(),
				visibileToasts: z.number(),
			}),
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
			toast: {
				position: 'bottom-right',
				richColors: true,
				expand: true,
				duration: 4000,
				visibileToasts: 5,
			},
		},
	});

	const jobQueue = yield* createJobQueue<RegisterShortcutJob>();
	const queueInitialSilentJob = Effect.gen(function* () {
		const initialSilentJob = Effect.gen(function* () {
			yield* registerShortcutsService.unregisterAllLocalShortcuts;
			yield* registerShortcutsService.unregisterAllGlobalShortcuts;
			yield* registerShortcutsService.registerLocalShortcut({
				shortcut: settings.value.currentLocalShortcut,
				callback: recorder.toggleRecording,
			});
			yield* registerShortcutsService.registerGlobalShortcut({
				shortcut: settings.value.currentGlobalShortcut,
				callback: recorder.toggleRecording,
			});
		});
		yield* jobQueue.addJobToQueue(initialSilentJob);
	});
	queueInitialSilentJob.pipe(Effect.catchAll(renderErrorAsToast), Effect.runPromise);

	return {
		get isPlaySoundEnabled() {
			return settings.value.isPlaySoundEnabled;
		},
		set isPlaySoundEnabled(newValue) {
			settings.value = { ...settings.value, isPlaySoundEnabled: newValue };
		},
		get isCopyToClipboardEnabled() {
			return settings.value.isCopyToClipboardEnabled;
		},
		set isCopyToClipboardEnabled(newValue) {
			settings.value = { ...settings.value, isCopyToClipboardEnabled: newValue };
		},
		get isPasteContentsOnSuccessEnabled() {
			return settings.value.isPasteContentsOnSuccessEnabled;
		},
		set isPasteContentsOnSuccessEnabled(newValue) {
			settings.value = { ...settings.value, isPasteContentsOnSuccessEnabled: newValue };
		},
		get selectedAudioInputDeviceId() {
			return settings.value.selectedAudioInputDeviceId;
		},
		set selectedAudioInputDeviceId(newValue) {
			settings.value = { ...settings.value, selectedAudioInputDeviceId: newValue };
		},
		get currentLocalShortcut() {
			return settings.value.currentLocalShortcut;
		},
		set currentLocalShortcut(newValue) {
			settings.value = { ...settings.value, currentLocalShortcut: newValue };
			const queueJob = Effect.gen(function* () {
				const job = Effect.gen(function* () {
					yield* registerShortcutsService.unregisterAllLocalShortcuts;
					yield* registerShortcutsService.registerLocalShortcut({
						shortcut: settings.value.currentLocalShortcut,
						callback: recorder.toggleRecording,
					});
					toast.success(`Local shortcut set to ${settings.value.currentLocalShortcut}`);
				});
				yield* jobQueue.addJobToQueue(job);
			});
			queueJob.pipe(Effect.catchAll(renderErrorAsToast), Effect.runPromise);
		},
		get isGlobalShortcutEnabled() {
			return registerShortcutsService.isGlobalShortcutEnabled;
		},
		get currentGlobalShortcut() {
			return settings.value.currentGlobalShortcut;
		},
		set currentGlobalShortcut(newValue) {
			settings.value = { ...settings.value, currentGlobalShortcut: newValue };
			const queueJob = Effect.gen(function* () {
				const job = Effect.gen(function* () {
					yield* registerShortcutsService.unregisterAllGlobalShortcuts;
					yield* registerShortcutsService.registerGlobalShortcut({
						shortcut: settings.value.currentGlobalShortcut,
						callback: recorder.toggleRecording,
					});
					toast.success(`Global shortcut set to ${settings.value.currentGlobalShortcut}`);
				});
				yield* jobQueue.addJobToQueue(job);
			});
			queueJob.pipe(Effect.catchAll(renderErrorAsToast), Effect.runPromise);
		},
		get apiKey() {
			return settings.value.apiKey;
		},
		set apiKey(newValue) {
			settings.value = { ...settings.value, apiKey: newValue };
		},
		get outputLanguage() {
			return settings.value.outputLanguage;
		},
		set outputLanguage(newValue) {
			settings.value = { ...settings.value, outputLanguage: newValue };
		},
		get toast() {
			return settings.value.toast;
		},
		set toast(newValue) {
			settings.value = { ...settings.value, toast: newValue };
		},
	};
});

export const settings = createSettings.pipe(
	Effect.provide(window.__TAURI__ ? RegisterShortcutsDesktopLive : RegisterShortcutsWebLive),
	Effect.runSync,
);

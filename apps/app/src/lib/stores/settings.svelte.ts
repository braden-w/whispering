import { RegisterShortcutsService } from '$lib/services/RegisterShortcutsService';
import { RegisterShortcutsDesktopLive } from '$lib/services/RegisterShortcutsServiceDesktopLive';
import { RegisterShortcutsWebLive } from '$lib/services/RegisterShortcutsServiceWebLive';
import { toast } from '$lib/services/ToastService';
import { renderErrorAsToast } from '$lib/services/renderErrorAsToast';
import { recorder } from '$lib/stores/recorder.svelte';
import { createJobQueue } from '$lib/utils/createJobQueue';
import { createPersistedState } from '$lib/utils/createPersistedState.svelte';
import { Schema as S } from '@effect/schema';
import { getDefaultSettings, settingsSchema } from '@repo/shared';
import { Effect } from 'effect';

type RegisterShortcutJob = Effect.Effect<void>;

export const settings = Effect.gen(function* () {
	const registerShortcutsService = yield* RegisterShortcutsService;
	const settings = createPersistedState({
		key: 'whispering-settings',
		schema: settingsSchema.pipe(S.mutable),
		defaultValue: getDefaultSettings('app'),
	});

	const jobQueue = yield* createJobQueue<RegisterShortcutJob>();

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
	}).pipe(Effect.catchAll(renderErrorAsToast));
	jobQueue.addJobToQueue(initialSilentJob).pipe(Effect.runPromise);

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

			const job = Effect.gen(function* () {
				yield* registerShortcutsService.unregisterAllLocalShortcuts;
				yield* registerShortcutsService.registerLocalShortcut({
					shortcut: settings.value.currentLocalShortcut,
					callback: recorder.toggleRecording,
				});
				yield* toast({
					variant: 'success',
					title: `Local shortcut set to ${settings.value.currentLocalShortcut}`,
					description: 'Press the shortcut to start recording',
				});
			}).pipe(Effect.catchAll(renderErrorAsToast));
			jobQueue.addJobToQueue(job).pipe(Effect.runPromise);
		},
		get isGlobalShortcutEnabled() {
			return registerShortcutsService.isGlobalShortcutEnabled;
		},
		get currentGlobalShortcut() {
			return settings.value.currentGlobalShortcut;
		},
		set currentGlobalShortcut(newValue) {
			settings.value = { ...settings.value, currentGlobalShortcut: newValue };

			const job = Effect.gen(function* () {
				yield* registerShortcutsService.unregisterAllGlobalShortcuts;
				yield* registerShortcutsService.registerGlobalShortcut({
					shortcut: settings.value.currentGlobalShortcut,
					callback: recorder.toggleRecording,
				});
				yield* toast({
					variant: 'success',
					title: `Global shortcut set to ${settings.value.currentGlobalShortcut}`,
					description: 'Press the shortcut to start recording',
				});
			}).pipe(Effect.catchAll(renderErrorAsToast));
			jobQueue.addJobToQueue(job).pipe(Effect.runPromise);
		},
		get groqApiKey() {
			return settings.value.groqApiKey;
		},
		set groqApiKey(newValue) {
			settings.value = { ...settings.value, groqApiKey: newValue };
		},
		get openAiApiKey() {
			return settings.value.openAiApiKey;
		},
		set openAiApiKey(newValue) {
			settings.value = { ...settings.value, openAiApiKey: newValue };
		},
		get outputLanguage() {
			return settings.value.outputLanguage;
		},
		set outputLanguage(newValue) {
			settings.value = { ...settings.value, outputLanguage: newValue };
		},
		get bitsPerSecond() {
			return settings.value.bitsPerSecond;
		},
		set bitsPerSecond(newValue) {
			settings.value = { ...settings.value, bitsPerSecond: newValue };
		},
	};
}).pipe(
	Effect.provide(window.__TAURI__ ? RegisterShortcutsDesktopLive : RegisterShortcutsWebLive),
	Effect.runSync,
);

import { recorder } from '$lib/stores';
import { createJobQueue } from '$lib/utils/createJobQueue';
import { createPersistedState } from '$lib/utils/createPersistedState.svelte';
import { RegisterShortcutsDesktopLive } from '@repo/services/implementations/register-shortcuts';
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
		key: 'whispering-is-play-sound-enabled',
		schema: z.boolean(),
		defaultValue: true,
	});
	const isCopyToClipboardEnabled = createPersistedState({
		key: 'whispering-is-copy-to-clipboard-enabled',
		schema: z.boolean(),
		defaultValue: true,
	});
	const isPasteContentsOnSuccessEnabled = createPersistedState({
		key: 'whispering-is-paste-contents-on-success-enabled',
		schema: z.boolean(),
		defaultValue: false,
	});
	const currentGlobalShortcut = createPersistedState({
		key: 'whispering-current-global-shortcut',
		schema: z.string(),
		defaultValue: registerShortcutsService.defaultShortcut,
	});
	const apiKey = createPersistedState({
		key: 'whispering-api-key',
		schema: z.string(),
		defaultValue: '',
	});
	const outputLanguage = createPersistedState({
		key: 'whispering-output-language',
		schema: z.string(),
		defaultValue: 'en',
	});

	const jobQueue = yield* createJobQueue<RegisterShortcutJob>();
	const queueInitialSilentJob = Effect.gen(function* () {
		const initialSilentJob = Effect.gen(function* () {
			yield* registerShortcutsService.unregisterAll();
			yield* registerShortcutsService.register({
				shortcut: settings.currentGlobalShortcut,
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
		get currentGlobalShortcut() {
			return currentGlobalShortcut.value;
		},
		set currentGlobalShortcut(newValue) {
			currentGlobalShortcut.value = newValue;
			const queueJob = Effect.gen(function* () {
				const job = Effect.gen(function* () {
					yield* registerShortcutsService.unregisterAll();
					yield* registerShortcutsService.register({
						shortcut: settings.currentGlobalShortcut,
						callback: recorder.toggleRecording,
					});
					toast.success(`Global shortcut set to ${settings.currentGlobalShortcut}`);
				}).pipe(
					Effect.catchAll((error) => {
						toast.error(error.message);
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
	Effect.provide(RegisterShortcutsDesktopLive),
	Effect.runSync,
);

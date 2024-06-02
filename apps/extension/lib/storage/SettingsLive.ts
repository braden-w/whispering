import { Effect, Layer } from 'effect';
import { z } from 'zod';
import { AppStorageService } from '../../../../packages/services/src/services/app-storage';
import { RegisterShortcutsService } from '../../../../packages/services/src/services/register-shortcuts';
import { SettingsService } from './Settings';
import { AppStorageFromContentScriptLive } from './AppStorageLive';
import { RegisterShortcutsWebLive } from '../../../../packages/services/src/implementations/register-shortcuts';

export const SettingsLive = Layer.effect(
	SettingsService,
	Effect.gen(function* () {
		const appStorageService = yield* AppStorageService;
		const registerShortcutsService = yield* RegisterShortcutsService;
		const getSettings = () =>
			appStorageService.get({
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
		return {
			get: getSettings,
			update: (updater) =>
				Effect.gen(function* () {
					const oldSettings = yield* getSettings();
					const newSettings = updater(oldSettings);
					yield* appStorageService.set({
						key: 'whispering-settings',
						value: newSettings,
					});
				}),
		};
	}),
).pipe(Layer.provide(RegisterShortcutsWebLive));

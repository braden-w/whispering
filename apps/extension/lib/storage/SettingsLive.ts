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
		return {
			get: () =>
				Effect.gen(function* () {
					return yield* appStorageService.get({
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
				}),
			set: (value) =>
				Effect.gen(function* () {
					yield* appStorageService.set({
						key: 'whispering-settings',
						value,
					});
				}),
		};
	}),
).pipe(Layer.provide(RegisterShortcutsWebLive));

import type { Effect } from 'effect';
import { Context } from 'effect';
import type { AppStorageError } from '../../../../packages/services/src/services/app-storage';

type Settings = Partial<{
	isPlaySoundEnabled: boolean;
	isCopyToClipboardEnabled: boolean;
	isPasteContentsOnSuccessEnabled: boolean;
	selectedAudioInputDeviceId: string;
	currentLocalShortcut: string;
	currentGlobalShortcut: string;
	apiKey: string;
	outputLanguage: string;
}>;

export class SettingsService extends Context.Tag('SettingsService')<
	SettingsService,
	{
		readonly get: () => Effect.Effect<Settings, AppStorageError>;
		readonly set: (value: Settings) => Effect.Effect<void, AppStorageError>;
	}
>() {}

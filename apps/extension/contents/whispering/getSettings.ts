import { localStorageService } from '~lib/services/local-storage';

export const getSettings = () =>
	localStorageService.get({
		key: 'whispering-settings',
		defaultValue: {
			isPlaySoundEnabled: true,
			isCopyToClipboardEnabled: true,
			isPasteContentsOnSuccessEnabled: true,
			selectedAudioInputDeviceId: '',
			currentLocalShortcut: 'space',
			currentGlobalShortcut: '',
			apiKey: '',
			outputLanguage: 'en',
		},
	});

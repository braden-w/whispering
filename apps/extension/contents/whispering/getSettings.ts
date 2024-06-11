import { localStorageService } from '~lib/services/local-storage';

const handler = () =>
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

export default handler;

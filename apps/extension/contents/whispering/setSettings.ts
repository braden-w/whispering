import { localStorageService, type Settings } from '~lib/services/local-storage';

const handler = (settings: Settings) =>
	localStorageService.set({
		key: 'whispering-settings',
		value: settings,
	});

export default handler;

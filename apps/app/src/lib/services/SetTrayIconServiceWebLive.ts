import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { Layer } from 'effect';
import { SetTrayIconService } from './SetTrayIconService';

export const SetTrayIconServiceWebLive = Layer.succeed(
	SetTrayIconService,
	SetTrayIconService.of({
		setTrayIcon: (icon) =>
			sendMessageToExtension({
				name: 'whispering-extension/setTrayIcon',
				body: { recorderState: icon },
			}),
	}),
);

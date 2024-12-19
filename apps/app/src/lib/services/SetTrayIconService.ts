import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { recorder } from '$lib/stores/recorder.svelte';
import {
	type WhisperingRecordingState,
	type WhisperingResult,
	tryAsyncWhispering,
} from '@repo/shared';
import { Menu, MenuItem } from '@tauri-apps/api/menu';
import { resolveResource } from '@tauri-apps/api/path';
import { TrayIcon } from '@tauri-apps/api/tray';

type SetTrayIconService = {
	setTrayIcon: (
		icon: WhisperingRecordingState,
	) => Promise<WhisperingResult<void>>;
};

export const SetTrayIconService = window.__TAURI_INTERNALS__
	? createSetTrayIconDesktopService()
	: createSetTrayIconWebService();

export function createSetTrayIconWebService(): SetTrayIconService {
	return {
		setTrayIcon: (icon: WhisperingRecordingState) =>
			sendMessageToExtension({
				name: 'whispering-extension/setTrayIcon',
				body: { recorderState: icon },
			}),
	};
}

export function createSetTrayIconDesktopService(): SetTrayIconService {
	const trayPromise = (async () => {
		const quitMenuItem = await MenuItem.new({
			text: 'Quit',
			action: (e) => console.log(e),
		});

		const trayMenu = await Menu.new({
			id: 'quit',
			items: [quitMenuItem],
		});

		const tray = await TrayIcon.new({
			id: 'tray',
			icon: await getIconPath('IDLE'),
			menu: trayMenu,
			tooltip: 'Your App Name',
			action: (e) => {
				if ('click' in e) {
					recorder.toggleRecording();
				}
			},
		});
		return tray;
	})();
	return {
		setTrayIcon: (recorderState: WhisperingRecordingState) =>
			tryAsyncWhispering({
				try: async () => {
					const iconPath = await getIconPath(recorderState);
					const tray = await trayPromise;
					return tray.setIcon(iconPath);
				},
				catch: (error) => ({
					_tag: 'WhisperingError',
					isWarning: true,
					title: `Could not set tray icon to ${recorderState} icon...`,
					description: 'Please check your system tray settings',
					action: {
						type: 'more-details',
						error,
					},
				}),
			}),
	};
}
async function getIconPath(recorderState: WhisperingRecordingState) {
	const iconPaths = {
		IDLE: 'recorder-state-icons/studio_microphone.png',
		RECORDING: 'recorder-state-icons/red_large_square.png',
		LOADING: 'recorder-state-icons/arrows_counterclockwise.png',
	} as const;
	return await resolveResource(iconPaths[recorderState]);
}

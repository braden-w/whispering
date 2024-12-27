import { recorder } from '$lib/stores/recorder.svelte';
import { Err, Ok, tryAsync } from '@epicenterhq/result';
import { extension } from '@repo/extension';
import type { WhisperingRecordingState } from '@repo/shared';
import { Menu, MenuItem } from '@tauri-apps/api/menu';
import { resolveResource } from '@tauri-apps/api/path';
import { TrayIcon } from '@tauri-apps/api/tray';

export type SetTrayIconServiceErr = Err<{
	_tag: 'TrayIconError';
	icon: WhisperingRecordingState;
}>;

export type SetTrayIconServiceResult<T> = Ok<T> | SetTrayIconServiceErr;

export const SetTrayIconServiceErr = (
	icon: WhisperingRecordingState,
): SetTrayIconServiceErr => Err({ _tag: 'TrayIconError', icon });

type SetTrayIconService = {
	setTrayIcon: (
		icon: WhisperingRecordingState,
	) => Promise<SetTrayIconServiceResult<void>>;
};

export const SetTrayIconService = window.__TAURI_INTERNALS__
	? createSetTrayIconDesktopService()
	: createSetTrayIconWebService();

export function createSetTrayIconWebService(): SetTrayIconService {
	return {
		setTrayIcon: async (icon: WhisperingRecordingState) => {
			const setRecorderStateResult = await extension.setRecorderState({
				recorderState: icon,
			});
			if (!setRecorderStateResult.ok) return SetTrayIconServiceErr(icon);
			return Ok(undefined);
		},
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
					recorder.toggleRecordingWithToast();
				}
			},
		});
		return tray;
	})();
	return {
		setTrayIcon: (recorderState: WhisperingRecordingState) =>
			tryAsync({
				try: async () => {
					const iconPath = await getIconPath(recorderState);
					const tray = await trayPromise;
					return tray.setIcon(iconPath);
				},
				mapErr: (error) => SetTrayIconServiceErr(recorderState),
			}),
	};
}

async function getIconPath(recorderState: WhisperingRecordingState) {
	const iconPaths = {
		IDLE: 'recorder-state-icons/studio_microphone.png',
		SESSION: 'recorder-state-icons/studio_microphone.png',
		'SESSION+RECORDING': 'recorder-state-icons/red_large_square.png',
	} as const satisfies Record<WhisperingRecordingState, string>;
	return await resolveResource(iconPaths[recorderState]);
}

import { recorder } from '$lib/stores/recorder.svelte';
import { Err, Ok, tryAsync } from '@epicenterhq/result';
import { extension } from '@repo/extension';
import type { WhisperingRecordingState } from '@repo/shared';
import { Menu, MenuItem } from '@tauri-apps/api/menu';
import { resolveResource } from '@tauri-apps/api/path';
import { TrayIcon } from '@tauri-apps/api/tray';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { exit } from '@tauri-apps/plugin-process';

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
			action: () => void exit(0),
		});

		const trayMenu = await Menu.new({
			id: 'quit',
			items: [quitMenuItem],
		});

		const tray = await TrayIcon.new({
			id: 'tray',
			icon: await getIconPath('IDLE'),
			menu: trayMenu,
			tooltip: 'Whispering',
			action: (e) => {
				switch (e.type) {
					case 'Click':
						recorder.toggleRecordingWithToast();
						break;
					case 'DoubleClick':
						getCurrentWindow().show();
						break;
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

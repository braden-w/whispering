import { recorder } from '$lib/stores/recorder.svelte';
import { settings } from '$lib/stores/settings.svelte';
import { Err, Ok, tryAsync } from '@epicenterhq/result';
import { extension } from '@repo/extension';
import {
	ALWAYS_ON_TOP_VALUES,
	type WhisperingRecordingState,
} from '@repo/shared';
import { Menu, MenuItem, CheckMenuItem } from '@tauri-apps/api/menu';
import { resolveResource } from '@tauri-apps/api/path';
import { TrayIcon } from '@tauri-apps/api/tray';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { exit } from '@tauri-apps/plugin-process';

const TRAY_ID = 'whispering-tray';

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
		const existingTray = await TrayIcon.getById(TRAY_ID);
		if (existingTray) return existingTray;

		const alwaysOnTopItems = await Promise.all(
			ALWAYS_ON_TOP_VALUES.map(async (value) =>
				CheckMenuItem.new({
					id: `always-on-top-${value}`,
					text: value,
					checked: settings.value.alwaysOnTop === value,
					action: () => {
						settings.value = { ...settings.value, alwaysOnTop: value };
					},
				}),
			),
		);

		// Create Always on Top menu
		const alwaysOnTopMenu = await Menu.new({
			id: 'always-on-top-menu',
			items: alwaysOnTopItems,
		});

		const trayMenu = await Menu.new({
			items: [
				// Window Controls Section
				await MenuItem.new({
					id: 'show',
					text: 'Show Window',
					action: () => getCurrentWindow().show(),
				}),

				await MenuItem.new({
					id: 'minimize',
					text: 'Hide Window',
					action: () => getCurrentWindow().minimize(),
				}),

				// Always on Top Section
				...alwaysOnTopItems,

				// Quit Section
				await MenuItem.new({
					id: 'quit',
					text: 'Quit',
					action: () => void exit(0),
				}),
			],
		});

		const tray = await TrayIcon.new({
			id: TRAY_ID,
			icon: await getIconPath('IDLE'),
			menu: trayMenu,
			menuOnLeftClick: false,
			action: (e) => {
				if (
					e.type === 'Click' &&
					e.button === 'Left' &&
					e.buttonState === 'Down'
				) {
					recorder.toggleRecordingWithToast();
					return true;
				}
				return false;
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

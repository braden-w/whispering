import type { NotificationService } from '@repo/shared';
import { Ok, tryAsync, WhisperingError } from '@repo/shared';
import {
	isPermissionGranted,
	requestPermission,
	sendNotification,
} from '@tauri-apps/plugin-notification';
import { nanoid } from 'nanoid/non-secure';

const createNotificationServiceDesktop = (): NotificationService => {
	return {
		notify: async ({ title, description }) => {
			const notifyResult = await tryAsync({
				try: async () => {
					let permissionGranted = await isPermissionGranted();
					if (!permissionGranted) {
						const permission = await requestPermission();
						permissionGranted = permission === 'granted';
					}
					if (permissionGranted) {
						sendNotification({ title });
					}
				},
				catch: (error) => ({
					_tag: 'WhisperingError',
					title: 'Notification error',
					description: 'Could not send notification',
					action: {
						type: 'more-details',
						error,
					},
				}),
			});
			if (!notifyResult.ok) return notifyResult;
			const uselessId = notifyResult.data;
			return Ok('');
		},
		clear: () => Ok(undefined),
	};
};

export const NotificationServiceDesktopLive =
	createNotificationServiceDesktop();

import type { NotificationService } from '@repo/shared';
import { Ok, tryAsyncWhispering } from '@repo/shared';
import {
	isPermissionGranted,
	requestPermission,
	sendNotification,
} from '@tauri-apps/plugin-notification';

const createNotificationServiceDesktop = (): NotificationService => {
	return {
		async notify({ title, description }) {
			const notifyResult = await tryAsyncWhispering({
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

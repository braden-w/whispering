import { Ok, tryAsync } from '@epicenterhq/result';
import { WhisperingErr } from '@repo/shared';
import {
	isPermissionGranted,
	requestPermission,
	sendNotification,
} from '@tauri-apps/plugin-notification';
import type { NotificationService } from './NotificationService';

function createNotificationServiceDesktop(): NotificationService {
	return {
		async notify({ title, description }) {
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
				mapErr: (error) =>
					WhisperingErr({
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
}

export const NotificationServiceDesktopLive =
	createNotificationServiceDesktop();

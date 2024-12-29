import { Ok, tryAsync } from '@epicenterhq/result';
import { WhisperingErr } from '@repo/shared';
import {
	isPermissionGranted,
	requestPermission,
	sendNotification,
	active,
	removeActive,
} from '@tauri-apps/plugin-notification';
import { nanoid } from 'nanoid/non-secure';
import type { NotificationService } from './NotificationService';

export function createNotificationServiceDesktop(): NotificationService {
	const removeNotificationById = async (id: number) => {
		const activeNotificationsResult = await tryAsync({
			try: async () => await active(),
			mapErr: (error) =>
				WhisperingErr({
					title: 'Unable to remove notification',
					description: 'Unable to retrieve active notifications.',
					action: { type: 'more-details', error },
				}),
		});
		if (!activeNotificationsResult.ok) return activeNotificationsResult;
		const activeNotifications = activeNotificationsResult.data;
		const matchingActiveNotification = activeNotifications.find(
			(notification) => notification.id === id,
		);
		if (matchingActiveNotification) {
			const removeActiveResult = await tryAsync({
				try: async () => await removeActive([matchingActiveNotification]),
				mapErr: (error) =>
					WhisperingErr({
						title: 'Unable to remove notification',
						description: `An error occurred while trying to remove notification with id ${id}.`,
						action: { type: 'more-details', error },
					}),
			});
			if (!removeActiveResult.ok) return removeActiveResult;
		}
		return Ok(undefined);
	};

	return {
		async notify({ id: idStringified = nanoid(), title, description }) {
			const id = stringToNumber(idStringified);

			await removeNotificationById(id);

			const notifyResult = await tryAsync({
				try: async () => {
					let permissionGranted = await isPermissionGranted();
					if (!permissionGranted) {
						const permission = await requestPermission();
						permissionGranted = permission === 'granted';
					}
					if (permissionGranted) {
						sendNotification({ id: id, title, body: description });
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
			return Ok(idStringified);
		},
		clear: async (idStringified) => {
			const removeNotificationResult = await removeNotificationById(
				stringToNumber(idStringified),
			);
			return removeNotificationResult;
		},
	};
}

function stringToNumber(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash);
}

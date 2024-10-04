import { NotificationService, WhisperingError } from '@repo/shared';
import {
	isPermissionGranted,
	requestPermission,
	sendNotification,
} from '@tauri-apps/plugin-notification';
import { Console, Effect, Layer } from 'effect';
import { nanoid } from 'nanoid/non-secure';

export const NotificationServiceDesktopLive = Layer.succeed(
	NotificationService,
	NotificationService.of({
		notify: ({ title, description }) =>
			Effect.tryPromise({
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
				catch: (error) =>
					new WhisperingError({
						title: 'Notification error',
						description: 'Could not send notification',
						action: {
							type: 'more-details',
							error,
						},
					}),
			}).pipe(
				Effect.map(() => nanoid()),
				Effect.tapError((error) => Console.error({ ...error })),
				Effect.catchAll(() => Effect.succeed(nanoid())),
			),
		clear: (notificationId: string) => Effect.sync(() => {}),
	}),
);

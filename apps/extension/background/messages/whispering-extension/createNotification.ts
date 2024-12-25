import { Ok, tryAsync } from '@epicenterhq/result';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { ToastAndNotifyOptions, WhisperingResult } from '@repo/shared';
import { WhisperingErr } from '@repo/shared';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
import { nanoid } from 'nanoid';
import { extension } from '.';
import { gotoTargetUrlInWhisperingTab } from './gotoTargetUrlInWhisperingTab';

export type CreateNotificationMessage = {
	notifyOptions: ToastAndNotifyOptions;
};
export type CreateNotificationResult = WhisperingResult<string>;

const handler: PlasmoMessaging.MessageHandler<
	CreateNotificationMessage,
	CreateNotificationResult
> = async ({ body }, res) => {
	const createNotification = async (): Promise<WhisperingResult<string>> => {
		if (!body?.notifyOptions) {
			return WhisperingErr({
				title: 'Error invoking notify command',
				description:
					'ToastOptions must be provided in the request body of the message',
			});
		}
		const { id = nanoid(), title, description, action } = body.notifyOptions;
		switch (action?.type) {
			case 'link': {
				const createLinkNotificationResult = await tryAsync({
					try: async () => {
						chrome.notifications.create(id, {
							priority: 2,
							title,
							message: description,
							type: 'basic',
							buttons: [{ title: action.label }],
							iconUrl: studioMicrophone,
						});

						chrome.notifications.onClicked.addListener(async (clickedId) => {
							if (clickedId === id) {
								chrome.notifications.clear(id);
								const gotoTargetUrlInWhisperingTabResult =
									await gotoTargetUrlInWhisperingTab(action.goto);
								if (!gotoTargetUrlInWhisperingTabResult.ok) {
									extension.createNotification({
										notifyOptions: gotoTargetUrlInWhisperingTabResult.error,
									});
								}
							}
						});

						chrome.notifications.onButtonClicked.addListener(
							async (id, buttonIndex) => {
								if (buttonIndex === 0) {
									chrome.notifications.clear(id);
									const gotoTargetUrlInWhisperingTabResult =
										await gotoTargetUrlInWhisperingTab(action.goto);
									if (!gotoTargetUrlInWhisperingTabResult.ok) {
										return extension.createNotification({
											notifyOptions: gotoTargetUrlInWhisperingTabResult.error,
										});
									}
								}
							},
						);
						return id;
					},
					mapErr: (error) =>
						WhisperingErr({
							title: 'Failed to show notification',
							description:
								'There was an error showing the notification in the background service worker.',
							action: { type: 'more-details', error },
						}),
				});
				if (!createLinkNotificationResult.ok)
					return createLinkNotificationResult;
				return Ok(createLinkNotificationResult.data);
			}
			case 'more-details': {
				const createNotificationResult = await tryAsync({
					try: async () => {
						chrome.notifications.create(id, {
							priority: 2,
							requireInteraction: true,
							title,
							message: description,
							type: 'basic',
							iconUrl: studioMicrophone,
						});
						return id;
					},
					mapErr: (error) =>
						WhisperingErr({
							title: 'Failed to show notification',
							description:
								'There was an error showing the notification in the background service worker.',
							action: { type: 'more-details', error },
						}),
				});
				if (!createNotificationResult.ok) return createNotificationResult;
				return Ok(createNotificationResult.data);
			}
			default: {
				const createNotificationResult = await tryAsync({
					try: async () => {
						chrome.notifications.create(id, {
							priority: 2,
							requireInteraction: true,
							title,
							message: description,
							type: 'basic',
							iconUrl: studioMicrophone,
						});
						return id;
					},
					mapErr: (error) =>
						WhisperingErr({
							title: 'Failed to show notification',
							description:
								'There was an error showing the notification in the background service worker.',
							action: { type: 'more-details', error },
						}),
				});
				if (!createNotificationResult.ok) return createNotificationResult;
				return Ok(createNotificationResult.data);
			}
		}
	};
	res.send(await createNotification());
};

export default handler;

import {
	type NotificationService,
	Ok,
	tryAsyncWhispering,
	WhisperingErr,
	type WhisperingResult,
} from '@repo/shared';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
import { nanoid } from 'nanoid/non-secure';
import { injectScript } from '~background/injectScript';
import { renderErrorAsNotification } from '~lib/errors';
import { getOrCreateWhisperingTabId } from '~lib/getOrCreateWhisperingTabId';

const createNotificationServiceBgswLive = (): NotificationService => ({
	async notify({ id: maybeId, title, description, action }) {
		const id = maybeId ?? nanoid();

		const createNotificationResult = await tryAsyncWhispering({
			try: async () => {
				if (!action) {
					chrome.notifications.create(id, {
						priority: 2,
						requireInteraction: true,
						title,
						message: description,
						type: 'basic',
						iconUrl: studioMicrophone,
					});
				} else {
					chrome.notifications.create(id, {
						priority: 2,
						title,
						message: description,
						type: 'basic',
						buttons: [{ title: action.label }],
						iconUrl: studioMicrophone,
					});

					const gotoTargetUrlInWhisperingTab = async (): Promise<
						WhisperingResult<void>
					> => {
						const getWhisperingTabIdResult = await getOrCreateWhisperingTabId();
						if (!getWhisperingTabIdResult.ok) return getWhisperingTabIdResult;
						const whisperingTabId = getWhisperingTabIdResult.data;
						if (!whisperingTabId)
							return WhisperingErr({
								title: 'Whispering tab not found',
								description: 'The Whispering tab was not found.',
								action: { type: 'none' },
							});
						const injectScriptResult = await injectScript<undefined, [string]>({
							tabId: whisperingTabId,
							commandName: 'goto',
							func: (route) => {
								try {
									window.goto(route);
									return { ok: true, data: undefined } as const;
								} catch (error) {
									return {
										ok: false,
										error: {
											_tag: 'WhisperingError',
											title: `Unable to go to route ${route} in Whispering tab`,
											description:
												'There was an error going to the route in the Whispering tab.',
											action: {
												type: 'more-details',
												error,
											},
										},
									} as const;
								}
							},
							args: [action.goto],
						});
						if (!injectScriptResult.ok) return injectScriptResult;
						await chrome.tabs.update(whisperingTabId, { active: true });
						return Ok(undefined);
					};

					chrome.notifications.onClicked.addListener(async (clickedId) => {
						if (clickedId === id) {
							chrome.notifications.clear(id);
							const gotoTargetUrlInWhisperingTabResult =
								await gotoTargetUrlInWhisperingTab();
							if (!gotoTargetUrlInWhisperingTabResult.ok)
								return renderErrorAsNotification(
									gotoTargetUrlInWhisperingTabResult,
								);
						}
					});

					chrome.notifications.onButtonClicked.addListener(
						async (id, buttonIndex) => {
							if (buttonIndex === 0) {
								chrome.notifications.clear(id);
								const gotoTargetUrlInWhisperingTabResult = await gotoTargetUrlInWhisperingTab();
								if (!gotoTargetUrlInWhisperingTabResult.ok)
									return renderErrorAsNotification(
										gotoTargetUrlInWhisperingTabResult,
									);
							}
						},
					);
				}
			},
			catch: (error) => ({
				_tag: 'WhisperingError',
				title: 'Failed to show notification',
				description:
					'There was an error showing the notification in the background service worker.',
				action: {
					type: 'more-details',
					error,
				},
			}),
		});
		if (!createNotificationResult.ok) return createNotificationResult;
		return Ok(id);
	},
	clear(id) {
		chrome.notifications.clear(id);
		return Ok(undefined);
	},
});

export const NotificationServiceBgswLive = createNotificationServiceBgswLive();

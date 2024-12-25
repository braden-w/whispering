import { Ok, tryAsync } from '@epicenterhq/result';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { ToastAndNotifyOptions, WhisperingResult } from '@repo/shared';
import { WhisperingErr } from '@repo/shared';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
import { nanoid } from 'nanoid';
import { injectScript } from '~background/injectScript';
import { renderErrorAsNotification } from '~lib/errors';
import { getOrCreateWhisperingTabId } from '~lib/getOrCreateWhisperingTabId';

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
		if (action?.type === 'link') {
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
								const gotoTargetUrlInWhisperingTabResult =
									await gotoTargetUrlInWhisperingTab(action.goto);
								if (!gotoTargetUrlInWhisperingTabResult.ok)
									return renderErrorAsNotification(
										gotoTargetUrlInWhisperingTabResult,
									);
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
			if (!createLinkNotificationResult.ok) return createLinkNotificationResult;
			return Ok(createLinkNotificationResult.data);
		}
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
	};
	res.send(await createNotification());
};

export async function gotoTargetUrlInWhisperingTab(
	path: string,
): Promise<WhisperingResult<void>> {
	const getWhisperingTabIdResult = await getOrCreateWhisperingTabId();
	if (!getWhisperingTabIdResult.ok) return getWhisperingTabIdResult;
	const whisperingTabId = getWhisperingTabIdResult.data;
	if (!whisperingTabId)
		return WhisperingErr({
			title: 'Whispering tab not found',
			description: 'The Whispering tab was not found.',
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
						variant: 'error',
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
		args: [path],
	});
	if (!injectScriptResult.ok) return injectScriptResult;
	await chrome.tabs.update(whisperingTabId, { active: true });
	return Ok(undefined);
}

export default handler;

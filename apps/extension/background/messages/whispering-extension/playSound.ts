import type { PlasmoMessaging } from '@plasmohq/messaging';
import {
	type ExternalMessageBody,
	type ExternalMessageReturnType,
	Ok,
	WhisperingErr,
	type WhisperingResult,
} from '@repo/shared';
import { getActiveTabId } from '~lib/getActiveTabId';

export type RequestBody = ExternalMessageBody<'whispering-extension/playSound'>;

export type ResponseBody = WhisperingResult<
	ExternalMessageReturnType<'whispering-extension/playSound'>
>;

const handler: PlasmoMessaging.MessageHandler<
	RequestBody,
	ResponseBody
> = async ({ body: sound }, res) => {
	const playSound = async () => {
		if (!sound) {
			return WhisperingErr({
				_tag: 'WhisperingError',
				title: 'Error invoking playSound command',
				description:
					'Sound must be provided in the request body of the message',
				action: { type: 'none' },
			});
		}
		console.info('Playing sound', sound);
		const getActiveTabIdResult = await getActiveTabId();
		if (!getActiveTabIdResult.ok) {
			return WhisperingErr({
				_tag: 'WhisperingError',
				title: 'Failed to get active tab ID',
				description: 'Failed to get active tab ID to play sound',
				action: {
					type: 'more-details',
					error: getActiveTabIdResult.error,
				},
			});
		}
		const activeTabId = getActiveTabIdResult.data;
		if (!activeTabId) {
			return WhisperingErr({
				_tag: 'WhisperingError',
				title: 'Failed to get active tab ID',
				description: 'Failed to get active tab ID to play sound',
				action: { type: 'none' },
			});
		}
		const sendMessageResult = await chrome.tabs.sendMessage(activeTabId, {
			message: 'playSound',
			sound,
		});
		if (!sendMessageResult) {
			return WhisperingErr({
				_tag: 'WhisperingError',
				title: `Failed to play ${sound} sound`,
				description: `Failed to play ${sound} sound in active tab ${activeTabId}`,
				action: { type: 'more-details', error: sendMessageResult },
			});
		}
		return Ok(undefined);
	};
	res.send(await playSound());
};

export default handler;

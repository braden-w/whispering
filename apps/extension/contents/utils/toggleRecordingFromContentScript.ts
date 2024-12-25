import { sendToBackground } from '@plasmohq/messaging';
import type * as ToggleRecording from '~background/messages/whispering-web/toggleRecording';
import { renderErrorAsNotification } from '~lib/errors';
import { tryAsync } from '@epicenterhq/result';

export const toggleRecordingFromContentScript = async (): Promise<void> => {
	const sendToToggleRecordingResult = await tryAsync({
		try: () =>
			sendToBackground<
				ToggleRecording.RequestBody,
				ToggleRecording.ResponseBody
			>({
				name: 'whispering-web/toggleRecording',
			}),
		mapErr: (error) => ({
			_tag: 'WhisperingError',
			title: 'Unable to toggle recording via background service worker',
			description:
				'There was likely an issue sending the message to the background service worker from the contentscript.',
			action: {
				type: 'more-details',
				error,
			},
		}),
	});
	if (!sendToToggleRecordingResult.ok) {
		return renderErrorAsNotification(sendToToggleRecordingResult);
	}
	const toggleRecordingResult = sendToToggleRecordingResult.data;
	if (!toggleRecordingResult.ok) {
		return renderErrorAsNotification(toggleRecordingResult);
	}
};

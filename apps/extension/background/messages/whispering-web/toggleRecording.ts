import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { WhisperingResult } from '@repo/shared';
import { injectScript } from '~background/injectScript';
import { getOrCreateWhisperingTabId } from '~lib/getOrCreateWhisperingTabId';

export type RequestBody = undefined;

export type ResponseBody = WhisperingResult<void>;

export const toggleRecording = async () => {
	const whisperingTabIdResult = await getOrCreateWhisperingTabId();
	if (!whisperingTabIdResult.ok) return whisperingTabIdResult;
	const whisperingTabId = whisperingTabIdResult.data;
	return await injectScript<undefined, []>({
		tabId: whisperingTabId,
		commandName: 'toggleRecording',
		func: () => {
			try {
				window.toggleRecording();
				return { ok: true, data: undefined } as const;
			} catch (error) {
				return {
					ok: false,
					error: {
						_tag: 'WhisperingError',
						variant: 'error',
						title: 'Unable to toggle recording',
						description:
							'There was an error toggling the recording. Please try again.',
						action: {
							type: 'more-details',
							error,
						},
					},
				} as const;
			}
		},
		args: [],
	});
};

const handler: PlasmoMessaging.MessageHandler<
	RequestBody,
	ResponseBody
> = async (req, res) => {
	const toggleRecordingResult = await toggleRecording();
	res.send(toggleRecordingResult);
};

export default handler;

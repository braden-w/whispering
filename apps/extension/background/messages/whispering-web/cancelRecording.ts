import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { WhisperingResult } from '@repo/shared';
import { injectScript } from '~background/injectScript';
import { getOrCreateWhisperingTabId } from '~lib/getOrCreateWhisperingTabId';

export type RequestBody = undefined;

export type ResponseBody = WhisperingResult<void>;

const handler: PlasmoMessaging.MessageHandler<
	RequestBody,
	ResponseBody
> = async (req, res) => {
	const cancelRecording = async () => {
		const whisperingTabIdResult = await getOrCreateWhisperingTabId();
		if (!whisperingTabIdResult.ok) return whisperingTabIdResult;
		const whisperingTabId = whisperingTabIdResult.data;
		return await injectScript<undefined, []>({
			tabId: whisperingTabId,
			commandName: 'cancelRecording',
			func: () => {
				try {
					window.cancelRecording();
					return { ok: true, data: undefined } as const;
				} catch (error) {
					return {
						ok: false,
						error: {
							_tag: 'WhisperingError',
							variant: 'error',
							title: 'Unable to cancel recording',
							description:
								'There was an error canceling the recording. Please try again.',
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

	res.send(await cancelRecording());
};

export default handler;

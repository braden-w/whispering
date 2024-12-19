import type { PlasmoMessaging } from '@plasmohq/messaging';
import type {
	ExternalMessageBody,
	ExternalMessageReturnType,
	WhisperingRecordingState,
	WhisperingResult,
} from '@repo/shared';
import { Ok, WhisperingErr, tryAsyncWhispering } from '@repo/shared';
import arrowsCounterclockwise from 'data-base64:~assets/arrows_counterclockwise.png';
import redLargeSquare from 'data-base64:~assets/red_large_square.png';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
import { whisperingStorage } from '~lib/storage/whisperingStorage';

const iconPaths = {
	IDLE: studioMicrophone,
	RECORDING: redLargeSquare,
	LOADING: arrowsCounterclockwise,
} as const satisfies Record<WhisperingRecordingState, string>;

export type RequestBody =
	ExternalMessageBody<'whispering-extension/setTrayIcon'>;

export type ResponseBody = WhisperingResult<
	ExternalMessageReturnType<'whispering-extension/setTrayIcon'>
>;

const handler: PlasmoMessaging.MessageHandler<
	RequestBody,
	ResponseBody
> = async ({ body }, res) => {
	const setTrayIcon = async () => {
		if (!body?.recorderState) {
			return WhisperingErr({
				title: 'Error invoking setTrayIcon command',
				description:
					'RecorderState must be provided in the request body of the message',
				action: { type: 'none' },
			});
		}

		whisperingStorage.setItem('whispering-recorder-state', body.recorderState);
		const path = iconPaths[body.recorderState];
		const setIconResult = await tryAsyncWhispering({
			try: () => chrome.action.setIcon({ path }),
			catch: (error) => ({
				_tag: 'WhisperingError',
				title: `Error setting icon to ${body.recorderState} icon`,
				description:
					"There was an error setting the tray icon using the browser's action API. Please try again.",
				action: { type: 'more-details', error },
			}),
		});
		if (!setIconResult.ok) return setIconResult;
		return Ok(undefined);
	};
	res.send(await setTrayIcon());
};

export default handler;

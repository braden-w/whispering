import redLargeSquare from 'data-base64:~assets/red_large_square.png';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
import { Ok, tryAsync } from '@epicenterhq/result';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { WhisperingRecordingState, WhisperingResult } from '@repo/shared';
import { WhisperingErr } from '@repo/shared';
import { whisperingStorage } from '~lib/storage/whisperingStorage';

const iconPaths = {
	IDLE: studioMicrophone,
	SESSION: studioMicrophone,
	'SESSION+RECORDING': redLargeSquare,
} as const satisfies Record<WhisperingRecordingState, string>;

export type SetRecorderStateMessage = {
	recorderState: WhisperingRecordingState;
};

export type SetRecorderStateResult = WhisperingResult<undefined>;

const handler: PlasmoMessaging.MessageHandler<
	SetRecorderStateMessage,
	SetRecorderStateResult
> = async ({ body }, res) => {
	const setRecorderState = async () => {
		if (!body?.recorderState) {
			return WhisperingErr({
				title: 'Error invoking setRecorderState command',
				description:
					'RecorderState must be provided in the request body of the message',
			});
		}

		whisperingStorage.setItem('whispering-recorder-state', body.recorderState);
		const path = iconPaths[body.recorderState];
		const setIconResult = await tryAsync({
			try: () => chrome.action.setIcon({ path }),
			mapErr: (error) =>
				WhisperingErr({
					title: `Error setting icon to ${body.recorderState} icon`,
					description:
						"There was an error setting the tray icon using the browser's action API. Please try again.",
					action: { type: 'more-details', error },
				}),
		});
		if (!setIconResult.ok) return setIconResult;
		return Ok(undefined);
	};
	res.send(await setRecorderState());
};

export default handler;

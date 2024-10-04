import arrowsCounterclockwise from 'data-base64:~assets/arrows_counterclockwise.png';
import redLargeSquare from 'data-base64:~assets/red_large_square.png';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import type {
	ExternalMessageBody,
	ExternalMessageReturnType,
	RecorderState,
	Result,
} from '@repo/shared';
import { WhisperingError, effectToResult } from '@repo/shared';
import { Effect } from 'effect';
import { renderErrorAsNotification } from '~lib/errors';
import { NotificationServiceBgswLive } from '~lib/services/NotificationServiceBgswLive';
import {
	STORAGE_KEYS,
	extensionStorageService,
} from '~lib/services/extension-storage';

const iconPaths = {
	IDLE: studioMicrophone,
	RECORDING: redLargeSquare,
	LOADING: arrowsCounterclockwise,
} as const satisfies Record<RecorderState, string>;

const setTrayIcon = (recorderState: RecorderState) =>
	Effect.gen(function* () {
		yield* extensionStorageService[STORAGE_KEYS.RECORDER_STATE].set(
			recorderState,
		);
		const path = iconPaths[recorderState];
		yield* Effect.tryPromise({
			try: () => chrome.action.setIcon({ path }),
			catch: (error) =>
				new WhisperingError({
					title: `Error setting icon to ${recorderState} icon`,
					description:
						error instanceof Error ? error.message : `Error: ${error}`,
					error,
				}),
		});
	});

export type RequestBody =
	ExternalMessageBody<'whispering-extension/setTrayIcon'>;

export type ResponseBody = Result<
	ExternalMessageReturnType<'whispering-extension/setTrayIcon'>
>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (
	{ body },
	res,
) =>
	Effect.gen(function* () {
		if (!body?.recorderState) {
			return yield* new WhisperingError({
				title: 'Error invoking setTrayIcon command',
				description:
					'RecorderState must be provided in the request body of the message',
			});
		}
		yield* setTrayIcon(body.recorderState);
	}).pipe(
		Effect.tapError(renderErrorAsNotification),
		Effect.provide(NotificationServiceBgswLive),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;

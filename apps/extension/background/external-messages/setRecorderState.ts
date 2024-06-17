import type { RecorderState } from '@repo/shared';
import { WhisperingError } from '@repo/shared';
import arrowsCounterclockwise from 'data-base64:~assets/arrows_counterclockwise.png';
import redLargeSquare from 'data-base64:~assets/red_large_square.png';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
import { Effect } from 'effect';
import { extensionStorageService } from '~lib/services/extension-storage';

const iconPaths = {
	IDLE: studioMicrophone,
	RECORDING: redLargeSquare,
	LOADING: arrowsCounterclockwise,
} as const satisfies Record<RecorderState, string>;

const handler = (recorderState: RecorderState) =>
	Effect.gen(function* () {
		yield* extensionStorageService.set({
			key: 'whispering-recording-state',
			value: recorderState,
		});
		const path = iconPaths[recorderState];
		yield* Effect.tryPromise({
			try: () => chrome.action.setIcon({ path }),
			catch: (error) =>
				new WhisperingError({
					title: `Error setting icon to ${recorderState} icon`,
					description: error instanceof Error ? error.message : `Error: ${error}`,
					error,
				}),
		});
	}).pipe(
		Effect.catchTags({
			SetExtensionStorageError: (error) =>
				new WhisperingError({
					title: `Error setting recorder state to ${recorderState}`,
					description:
						error instanceof Error
							? error.message
							: 'An error occurred while setting the recorder state via the Chrome storage API.',
					error,
				}),
		}),
	);

export default handler;

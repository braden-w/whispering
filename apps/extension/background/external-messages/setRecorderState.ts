import type { RecorderState } from '@repo/shared';
import arrowsCounterclockwise from 'data-base64:~assets/arrows_counterclockwise.png';
import redLargeSquare from 'data-base64:~assets/red_large_square.png';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
import { Console, Effect } from 'effect';
import { WhisperingError } from '@repo/shared';
import { extensionStorageService } from '~lib/services/extension-storage';

const setIcon = (icon: 'IDLE' | 'STOP' | 'LOADING') =>
	Effect.gen(function* () {
		const iconPaths = {
			IDLE: studioMicrophone,
			STOP: redLargeSquare,
			LOADING: arrowsCounterclockwise,
		} as const;
		const path = iconPaths[icon];
		yield* Effect.tryPromise({
			try: () => chrome.action.setIcon({ path }),
			catch: (error) =>
				new WhisperingError({
					title: `Error setting icon to ${icon} icon`,
					description: error instanceof Error ? error.message : `Error: ${error}`,
					error,
				}),
		});
		yield* Console.info('Icon set to', icon);
	});

const handler = (recorderState: RecorderState) =>
	Effect.gen(function* () {
		yield* extensionStorageService.set({
			key: 'whispering-recording-state',
			value: recorderState,
		});
		switch (recorderState) {
			case 'IDLE':
				yield* setIcon('IDLE');
				break;
			case 'RECORDING':
				yield* setIcon('STOP');
				break;
			case 'LOADING':
				yield* setIcon('LOADING');
				break;
		}
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

import type { RecorderState } from '@repo/shared';
import arrowsCounterclockwise from 'data-base64:~assets/arrows_counterclockwise.png';
import redLargeSquare from 'data-base64:~assets/red_large_square.png';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
import { Console, Effect } from 'effect';
import { BackgroundServiceWorkerError } from '~lib/commands';
import { extensionStorage } from '~lib/services/extension-storage';

const setIcon = (icon: 'IDLE' | 'STOP' | 'LOADING') =>
	Effect.tryPromise({
		try: () => {
			const path = ((icon: 'IDLE' | 'STOP' | 'LOADING') => {
				switch (icon) {
					case 'IDLE':
						return studioMicrophone;
					case 'STOP':
						return redLargeSquare;
					case 'LOADING':
						return arrowsCounterclockwise;
				}
			})(icon);
			return chrome.action.setIcon({ path });
		},
		catch: (error) =>
			new BackgroundServiceWorkerError({
				title: `Error setting icon to ${icon} icon`,
				description: error instanceof Error ? error.message : undefined,
				error,
			}),
	}).pipe(Effect.tap(() => Console.info('Icon set to', icon)));

const handler = (recorderState: RecorderState) =>
	Effect.gen(function* () {
		yield* extensionStorage.set({
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
	});

export default handler;

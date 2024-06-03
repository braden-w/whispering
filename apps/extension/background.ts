import redLargeSquare from 'data-base64:~assets/red_large_square.png';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
import { Data, Effect } from 'effect';
import { Storage } from '@plasmohq/storage';
import { invokeCommand } from '~lib/utils/commands';
import { MessageToBackgroundRequest } from '~lib/utils/commands';

class SetIconError extends Data.TaggedError('SetIconError')<{
	message: string;
	origError?: unknown;
}> {}

const storage = new Storage();
storage.watch({
	'whispering-recording-state': (c) =>
		Effect.gen(function* () {
			const recordingState = c.newValue;
			switch (recordingState) {
				case 'IDLE':
					yield* Effect.tryPromise({
						try: () => chrome.action.setIcon({ path: studioMicrophone }),
						catch: () => new SetIconError({ message: 'Error setting icon to studio microphone' }),
					});
					break;
				case 'RECORDING':
					yield* Effect.tryPromise({
						try: () => chrome.action.setIcon({ path: redLargeSquare }),
						catch: () => new SetIconError({ message: 'Error setting icon to red large square' }),
					});
					break;
			}
		}).pipe(Effect.runSync),
});

Effect.gen(function* () {
	chrome.runtime.onInstalled.addListener((details) =>
		Effect.gen(function* () {
			if (details.reason === 'install') {
				yield* invokeCommand.openOptionsPage.fromBackground();
			}
		}).pipe(Effect.runSync),
	);

	chrome.commands.onCommand.addListener((command) =>
		Effect.gen(function* () {
			if (command === 'toggleRecording') {
				yield* invokeCommand.toggleRecording.fromBackground();
			}
		}).pipe(Effect.runPromise),
	);

	chrome.runtime.onMessage.addListener((message: MessageToBackgroundRequest) =>
		Effect.gen(function* () {
			switch (message.action) {
				case 'openOptionsPage':
					yield* invokeCommand.openOptionsPage.fromBackground();
					break;
			}
		}).pipe(Effect.runPromise),
	);
}).pipe(Effect.runSync);

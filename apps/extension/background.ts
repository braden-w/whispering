import redLargeSquare from 'data-base64:~assets/red_large_square.png';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
import { Data, Effect } from 'effect';
import { ExtensionStorageService } from '~lib/services/ExtensionStorage';
import { ExtensionStorageLive } from '~lib/services/ExtensionStorageLive';
import { recorderStateSchema } from '~lib/services/RecorderService';
import { commands, type MessageToContext } from '~lib/utils/commands';

class SetIconError extends Data.TaggedError('SetIconError')<{
	message: string;
	origError?: unknown;
}> {}

const syncIconWithExtensionStorage = Effect.gen(function* () {
	const extensionStorage = yield* ExtensionStorageService;
	yield* extensionStorage.watch({
		key: 'whispering-recording-state',
		schema: recorderStateSchema,
		callback: (recordingState) =>
			Effect.gen(function* () {
				switch (recordingState) {
					case 'IDLE':
						yield* Effect.tryPromise({
							try: () => chrome.action.setIcon({ path: studioMicrophone }),
							catch: () => new SetIconError({ message: 'Error setting icon to studio microphone' }),
						});
					case 'RECORDING':
						yield* Effect.tryPromise({
							try: () => chrome.action.setIcon({ path: redLargeSquare }),
							catch: () => new SetIconError({ message: 'Error setting icon to stop icon' }),
						});
				}
			}),
	});
}).pipe(Effect.provide(ExtensionStorageLive), Effect.runSync);

chrome.runtime.onInstalled.addListener((details) =>
	Effect.gen(function* () {
		if (details.reason === 'install') {
			yield* commands.openOptionsPage.runInBackgroundServiceWorker();
		}
	}).pipe(Effect.runSync),
);

chrome.commands.onCommand.addListener((command) =>
	Effect.gen(function* () {
		if (command === 'toggleRecording') {
			yield* commands.toggleRecording.invokeFromBackgroundServiceWorker();
		}
	}).pipe(Effect.runPromise),
);

const registerListeners = chrome.runtime.onMessage.addListener(
	(message: MessageToContext<'BackgroundServiceWorker'>, sender, sendResponse) =>
		Effect.gen(function* () {
			const { commandName, args } = message;
			const correspondingCommand = commands[commandName];
			sendResponse(yield* correspondingCommand.runInBackgroundServiceWorker(...args));
			return true; // Will respond asynchronously.
		}).pipe(Effect.runPromise),
);

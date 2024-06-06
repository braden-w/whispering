import { Console } from 'effect';
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
	}).pipe(Effect.runPromise),
);

chrome.commands.onCommand.addListener((command) => {
	if (command !== 'toggleRecording') return false;
	const program = Effect.gen(function* () {
		yield* Console.info('Toggling recording from background service worker');
		yield* commands.toggleRecording.invokeFromBackgroundServiceWorker();
	});
	program.pipe(Effect.runPromise);
});

const _registerListeners = chrome.runtime.onMessage.addListener(
	(message: MessageToContext<'BackgroundServiceWorker'>, sender, sendResponse) => {
		const program = Effect.gen(function* () {
			const { commandName, args } = message;
			yield* Console.info('Received message in BackgroundServiceWorker', { commandName, args });
			const correspondingCommand = commands[commandName];
			const response = yield* correspondingCommand.runInBackgroundServiceWorker(...args);
			yield* Console.info(
				`Responding to invoked command ${commandName} in BackgroundServiceWorker`,
				{
					response,
				},
			);
			sendResponse(response);
		});
		program.pipe(Effect.runPromise);
		return true; // Will respond asynchronously.
	},
);

import { externalMessageSchema } from '@repo/shared';
import { Console, Effect } from 'effect';
import { extensionStorage } from '~lib/services/extension-storage';
import { serviceWorkerCommands } from './serviceWorkerCommands';

export const registerOnMessageExternalToggleRecording = Effect.sync(() =>
	chrome.runtime.onMessageExternal.addListener((requestUnparsed, sender, sendResponse) =>
		Effect.gen(function* () {
			yield* Console.info('Received message from external website', requestUnparsed);
			const externalMessage = externalMessageSchema.parse(requestUnparsed);
			switch (externalMessage.message) {
				case 'setRecorderState':
					const { recorderState } = externalMessage;
					yield* extensionStorage.set({
						key: 'whispering-recording-state',
						value: recorderState,
					});
					switch (recorderState) {
						case 'IDLE':
							yield* serviceWorkerCommands.setIcon('IDLE');
							break;
						case 'RECORDING':
							yield* serviceWorkerCommands.setIcon('STOP');
							break;
					}
					break;
				case 'transcription':
					const { transcription } = externalMessage;
					const response = yield* serviceWorkerCommands.setClipboardText(transcription);
					sendResponse(response);
					break;
			}
		}).pipe(Effect.runPromise),
	),
);

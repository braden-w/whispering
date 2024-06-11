import { externalMessageSchema } from '@repo/shared';
import { Console, Effect } from 'effect';
import setClipboardText from './setClipboardText';
import setRecorderState from './setRecorderState';

export const registerOnMessageExternalToggleRecording = Effect.sync(() =>
	chrome.runtime.onMessageExternal.addListener((requestUnparsed, sender, sendResponse) =>
		Effect.gen(function* () {
			yield* Console.info('Received message from external website', requestUnparsed);
			const externalMessage = externalMessageSchema.parse(requestUnparsed);
			switch (externalMessage.message) {
				case 'setRecorderState':
					const { recorderState } = externalMessage;
					yield* setRecorderState(recorderState);
					break;
				case 'transcription':
					const { transcription } = externalMessage;
					const response = yield* setClipboardText(transcription);
					sendResponse(response);
					break;
			}
		}).pipe(Effect.runPromise),
	),
);

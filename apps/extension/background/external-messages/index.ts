import { externalMessageSchema } from '@repo/shared';
import { Console, Effect } from 'effect';
import { catchErrorsAsToast } from '~lib/errors';
import setClipboardText from './setClipboardText';
import setRecorderState from './setRecorderState';

export const registerExternalListener = () =>
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
		}).pipe(
			catchErrorsAsToast,
			Effect.runPromise),
	);

import { externalMessageSchema, type Result } from '@repo/shared';
import { Console, Effect } from 'effect';
import { renderErrorAsToast } from '~lib/errors';
import setClipboardText from './setClipboardText';
import setRecorderState from './setRecorderState';

export const registerExternalListener = () =>
	chrome.runtime.onMessageExternal.addListener(
		(requestUnparsed, sender, sendResponse: <R extends Result<any>>(response: R) => void) =>
			Effect.gen(function* () {
				yield* Console.info('Received message from external website', requestUnparsed);
				const externalMessage = externalMessageSchema.parse(requestUnparsed);
				switch (externalMessage.message) {
					case 'setRecorderState':
						const { recorderState } = externalMessage;
						return yield* setRecorderState(recorderState);
					case 'setClipboardText':
						const { transcribedText } = externalMessage;
						return yield* setClipboardText(transcribedText);
				}
			}).pipe(
				Effect.tapError(renderErrorAsToast),
				Effect.map((result) => ({ isSuccess: true, data: result }) as const),
				Effect.catchAll((error) => Effect.succeed({ isSuccess: false, error } as const)),
				Effect.map((response) => sendResponse(response)),
				Effect.runPromise,
			),
	);

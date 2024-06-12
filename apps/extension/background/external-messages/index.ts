import { externalMessageSchema, type Result } from '@repo/shared';
import { Console, Effect } from 'effect';
import { WhisperingError, renderErrorAsToast } from '~lib/errors';
import setClipboardText from './setClipboardText';
import setRecorderState from './setRecorderState';

export const registerExternalListener = () =>
	chrome.runtime.onMessageExternal.addListener(
		(requestUnparsed, sender, sendResponse: <R extends Result<any>>(response: R) => void) =>
			Effect.gen(function* () {
				yield* Console.info('Received message from external website', requestUnparsed);
				const externalMessage = externalMessageSchema.parse(requestUnparsed);
				const processExternalMessageProgram = Effect.gen(function* () {
					switch (externalMessage.message) {
						case 'setRecorderState':
							const { recorderState } = externalMessage;
							return yield* setRecorderState(recorderState);
						case 'setClipboardText':
							const { transcribedText } = externalMessage;
							return yield* setClipboardText(transcribedText);
					}
				}).pipe(
					Effect.catchTags({
						GetCurrentTabIdError: () =>
							new WhisperingError({
								title: `Unable to get current tab ID while handling "${externalMessage.message}" command from Whispering website`,
								description:
									'This might be due to a permissions issue or an unexpected tab state. Please check your Whispering tabs and try again.',
							}),
						SetExtensionStorageError: ({ key, value, error }) =>
							new WhisperingError({
								title: `Unable to set "${key}" in extension storage while handling "${externalMessage.message}" command from Whispering website`,
								description:
									'Please check your local storage settings on the Whispering website and try again.',
								error: error,
							}),
					}),
				);
				return yield* processExternalMessageProgram;
			}).pipe(
				Effect.tapError(renderErrorAsToast),
				Effect.map((result) => ({ isSuccess: true, data: result }) as const),
				Effect.catchAll((error) => Effect.succeed({ isSuccess: false, error } as const)),
				Effect.map((response) => sendResponse(response)),
				Effect.runPromise,
			),
	);

import { ToastService, externalMessageSchema, type Result } from '@repo/shared';
import { Console, Effect } from 'effect';
import { renderErrorAsToast } from '~lib/errors';
import { WhisperingError } from '@repo/shared';
import { ToastServiceLive } from '~lib/services/ToastServiceLive';
import playSound from './playSound';
import setClipboardText from './setClipboardText';
import setRecorderState from './setRecorderState';
import writeTextToCursor from './writeTextToCursor';

export const registerExternalListener = () =>
	chrome.runtime.onMessageExternal.addListener(
		(requestUnparsed, sender, sendResponse: <R extends Result<any>>(response: R) => void) =>
			Effect.gen(function* () {
				yield* Console.info('Received message from external website', requestUnparsed);
				const externalMessageParseResult = externalMessageSchema.safeParse(requestUnparsed);
				if (!externalMessageParseResult.success) {
					yield* Console.error(
						'Failed to parse external message',
						externalMessageParseResult.error,
					);
					return yield* new WhisperingError({
						title: 'Failed to parse external message',
						description: 'The external message was not in the expected format.',
						error: externalMessageParseResult.error,
					});
				}
				const externalMessage = externalMessageParseResult.data;
				switch (externalMessage.message) {
					case 'setRecorderState':
						const { recorderState } = externalMessage;
						return yield* setRecorderState(recorderState);
					case 'setClipboardText':
						return yield* setClipboardText(externalMessage.transcribedText);
					case 'writeTextToCursor':
						return yield* writeTextToCursor(externalMessage.transcribedText);
					case 'toast':
						const { toast } = yield* ToastService;
						const { toastOptions } = externalMessage;
						return toast(toastOptions);
					case 'playSound': {
						const { sound } = externalMessage;
						return yield* playSound(sound);
					}
				}
			}).pipe(
				Effect.provide(ToastServiceLive),
				Effect.tapError(renderErrorAsToast),
				Effect.map((result) => ({ isSuccess: true, data: result }) as const),
				Effect.catchAll((error) => Effect.succeed({ isSuccess: false, error } as const)),
				Effect.map((response) => sendResponse(response)),
				Effect.runPromise,
			),
	);

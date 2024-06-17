import { Schema as S } from '@effect/schema';
import { ToastService, effectToResult, externalMessageSchema, type Result } from '@repo/shared';
import { Console, Effect, Either } from 'effect';
import { renderErrorAsToast } from '~lib/errors';
import { WhisperingError } from '@repo/shared';
import { ToastServiceBgswLive } from '~lib/services/ToastServiceBgswLive';
import { playSound } from './playSound';
import { setClipboardText } from './setClipboardText';
import { setRecorderState } from './setRecorderState';
import { writeTextToCursor } from './writeTextToCursor';

export const registerExternalListener = () =>
	chrome.runtime.onMessageExternal.addListener(
		(requestUnparsed, sender, sendResponse: <R extends Result<any>>(response: R) => void) =>
			Effect.gen(function* () {
				yield* Console.info('Received message from external website', requestUnparsed);
				const externalMessage = yield* S.decode(externalMessageSchema)(requestUnparsed).pipe(
					Effect.mapError(
						(error) =>
							new WhisperingError({
								title: 'Failed to parse external message',
								description: 'The external message was not in the expected format.',
								error,
							}),
					),
				);
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
					case 'playSound':
						const { sound } = externalMessage;
						return yield* playSound(sound);
				}
			}).pipe(
				Effect.provide(ToastServiceBgswLive),
				Effect.tapError(renderErrorAsToast),
				effectToResult,
				Effect.map((response) => sendResponse(response)),
				Effect.runPromise,
			),
	);

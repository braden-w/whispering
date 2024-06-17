import { Schema as S } from '@effect/schema';
import { WhisperingError, effectToResult, externalMessageSchema, type Result } from '@repo/shared';
import { Console, Effect } from 'effect';
import { renderErrorAsToast } from '~lib/errors';
import { playSound } from './playSound';
import { setClipboardText } from './setClipboardText';
import { setRecorderState } from './setRecorderState';
import { toast } from './toast';
import { writeTextToCursor } from './writeTextToCursor';

export const registerExternalListener = () =>
	chrome.runtime.onMessageExternal.addListener(
		(requestUnparsed, sender, sendResponse: <R extends Result<any>>(response: R) => void) =>
			Effect.gen(function* () {
				yield* Console.info('Received message from external website', requestUnparsed);
				const { name, body } = yield* S.decode(externalMessageSchema)(requestUnparsed);
				switch (name) {
					case 'setRecorderState':
						return yield* setRecorderState(body.recorderState);
					case 'setClipboardText':
						return yield* setClipboardText(body.transcribedText);
					case 'writeTextToCursor':
						return yield* writeTextToCursor(body.transcribedText);
					case 'toast':
						return toast(body.toastOptions);
					case 'playSound':
						return yield* playSound(body.sound);
				}
			}).pipe(
				Effect.catchTags({
					ParseError: (error) =>
						new WhisperingError({
							title: 'Failed to parse external message',
							description: 'The external message was not in the expected format.',
							error,
						}),
				}),
				Effect.tapError(renderErrorAsToast('bgsw')),
				effectToResult,
				Effect.map(sendResponse),
				Effect.runPromise,
			),
	);

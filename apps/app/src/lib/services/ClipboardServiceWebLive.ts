import { sendMessageToExtension } from '$lib/messaging';
import { WhisperingError } from '@repo/shared';
import { Effect, Layer } from 'effect';
import { ClipboardError, ClipboardService } from './ClipboardService';
import { ToastServiceLive } from './ToastServiceLive';

export const ClipboardServiceWebLive = Layer.effect(
	ClipboardService,
	Effect.gen(function* () {
		const setClipboardText = (text: string) =>
			Effect.tryPromise({
				try: () => navigator.clipboard.writeText(text),
				catch: (error) =>
					new ClipboardError({
						title: 'Unable to write to clipboard',
						description: error instanceof Error ? error.message : 'Please try again.',
						error,
					}),
			}).pipe(
				Effect.catchAll(() =>
					sendMessageToExtension<string, WhisperingError>({
						message: 'setClipboardText',
						transcribedText: text,
					}),
				),
			);

		const writeText = (text: string) =>
			Effect.try({
				try: () => {
					return;
				},
				catch: (error) =>
					new ClipboardError({
						title: 'Unable to paste from clipboard',
						description: error instanceof Error ? error.message : 'Please try again.',
						error,
					}),
			}).pipe(
				Effect.catchAll(() =>
					sendMessageToExtension<string, WhisperingError>({
						message: 'writeTextToCursor',
						transcribedText: text,
					}),
				),
			);

		return {
			setClipboardText,
			writeText,
		};
	}).pipe(Effect.provide(ToastServiceLive)),
);

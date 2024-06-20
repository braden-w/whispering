import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { WhisperingError } from '@repo/shared';
import { Effect, Layer } from 'effect';
import { ClipboardService } from './ClipboardService';

export const ClipboardServiceWebLive = Layer.succeed(
	ClipboardService,
	ClipboardService.of({
		setClipboardText: (text) =>
			Effect.tryPromise({
				try: () => navigator.clipboard.writeText(text),
				catch: (error) =>
					new WhisperingError({
						title: 'Unable to write to clipboard',
						description: error instanceof Error ? error.message : 'Please try again.',
						error,
					}),
			}).pipe(
				Effect.catchAll(() =>
					sendMessageToExtension({
						name: 'external/setClipboardText',
						body: { transcribedText: text },
					}),
				),
			),
		writeText: (text) =>
			sendMessageToExtension({
				name: 'external/writeTextToCursor',
				body: { transcribedText: text },
			}),
	}),
);

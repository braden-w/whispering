import { extensionCommands } from '$lib/extensionCommands';
import { WhisperingError } from '@repo/shared';
import { Effect, Layer } from 'effect';
import { ClipboardService } from './ClipboardService';

export const ClipboardServiceWebLive = Layer.effect(
	ClipboardService,
	Effect.gen(function* () {
		const setClipboardText = (text: string) =>
			Effect.tryPromise({
				try: () => navigator.clipboard.writeText(text),
				catch: (error) =>
					new WhisperingError({
						title: 'Unable to write to clipboard',
						description: error instanceof Error ? error.message : 'Please try again.',
						error,
					}),
			}).pipe(Effect.catchAll(() => extensionCommands.setClipboardText(text)));

		const writeText = (text: string) =>
			Effect.try({
				try: () => {
					return;
				},
				catch: (error) =>
					new WhisperingError({
						title: 'Unable to paste from clipboard',
						description: error instanceof Error ? error.message : 'Please try again.',
						error,
					}),
			}).pipe(Effect.catchAll(() => extensionCommands.writeTextToCursor(text)));

		return {
			setClipboardText,
			writeText,
		};
	}),
);

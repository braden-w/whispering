import { Effect, Layer } from 'effect';
import { ClipboardError, ClipboardService } from './ClipboardService';

export const ClipboardServiceWebLive = Layer.succeed(
	ClipboardService,
	ClipboardService.of({
		setClipboardText: (text) =>
			Effect.tryPromise({
				try: () => navigator.clipboard.writeText(text),
				catch: (error) =>
					new ClipboardError({ message: 'Failed to write to clipboard', origError: error }),
			}),
		writeText: (text) =>
			Effect.try({
				try: () => {
					return;
				},
				catch: (error) =>
					new ClipboardError({ message: 'Failed to paste from clipboard', origError: error }),
			}),
	}),
);

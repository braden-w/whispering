import { Effect, Layer } from 'effect';
import { ClipboardError, ClipboardService } from './ClipboardService';

export const ClipboardServiceWebLive = Layer.succeed(
	ClipboardService,
	ClipboardService.of({
		setClipboardText: (text) =>
			Effect.tryPromise({
				try: () => navigator.clipboard.writeText(text),
				catch: (error) =>
					new ClipboardError({ title: 'Failed to write to clipboard', error: error }),
			}),
		writeText: (text) =>
			Effect.try({
				try: () => {
					return;
				},
				catch: (error) =>
					new ClipboardError({ title: 'Failed to paste from clipboard', error: error }),
			}),
	}),
);

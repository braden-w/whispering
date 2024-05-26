import { Effect, Layer } from 'effect';
import { ClipboardError, ClipboardService } from '../../services/clipboard';

export const ClipboardServiceLive = Layer.succeed(
	ClipboardService,
	ClipboardService.of({
		getClipboardText: Effect.tryPromise({
			try: () => navigator.clipboard.readText(),
			catch: (error) =>
				new ClipboardError({ message: 'Failed to read from clipboard', origError: error }),
		}),
		setClipboardText: (text) =>
			Effect.tryPromise({
				try: () => navigator.clipboard.writeText(text),
				catch: (error) =>
					new ClipboardError({ message: 'Failed to write to clipboard', origError: error }),
			}),
		pasteTextFromClipboard: Effect.try({
			try: () => {
				return;
			},
			catch: (error) =>
				new ClipboardError({ message: 'Failed to paste from clipboard', origError: error }),
		}),
	}),
);

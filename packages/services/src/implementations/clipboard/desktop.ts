import { writeText } from '@tauri-apps/api/clipboard';
import { Effect, Layer } from 'effect';
import { ClipboardError, ClipboardService } from '../../services/clipboard';

export const ClipboardServiceDesktopLive = Layer.succeed(
	ClipboardService,
	ClipboardService.of({
		setClipboardText: (text) =>
			Effect.tryPromise({
				try: () => writeText(text),
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

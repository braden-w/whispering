import type { ClipboardService } from '@repo/recorder/services/clipboard';
import { ClipboardError } from '@repo/recorder/services/clipboard';
import { Effect, type Context } from 'effect';

export const clipboardService: Context.Tag.Service<ClipboardService> = {
	getClipboard: Effect.tryPromise({
		try: () => navigator.clipboard.readText(),
		catch: (error) =>
			new ClipboardError({ message: 'Failed to read from clipboard', origError: error })
	}),
	setClipboard: (text) =>
		Effect.tryPromise({
			try: () => navigator.clipboard.writeText(text),
			catch: (error) =>
				new ClipboardError({ message: 'Failed to write to clipboard', origError: error })
		}),
	pasteTextFromClipboard: Effect.try({
		try: () => {
			return;
		},
		catch: (error) =>
			new ClipboardError({ message: 'Failed to paste from clipboard', origError: error })
	})
};

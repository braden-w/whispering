import type { Context } from 'effect';
import { Effect } from 'effect';
import type { ClipboardService } from '../../services/clipboard';
import { ClipboardError } from '../../services/clipboard';

export const clipboardService: Context.Tag.Service<ClipboardService> = {
	getClipboardText: Effect.tryPromise({
		try: () => navigator.clipboard.readText(),
		catch: (error) =>
			new ClipboardError({ message: 'Failed to read from clipboard', origError: error })
	}),
	setClipboardText: (text) =>
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

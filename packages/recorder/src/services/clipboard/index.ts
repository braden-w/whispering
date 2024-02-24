import type { Effect } from 'effect';
import { Context, Data } from 'effect';

export class ClipboardError extends Data.TaggedError('TranscribeError')<{
	message: string;
	origError?: unknown;
}> {}

export class ClipboardService extends Context.Tag('ClipboardService')<
	ClipboardService,
	{
		readonly getClipboard: Effect.Effect<string, ClipboardError>;
		/**
		 * Writes text to the user's clipboard.
		 * @param text The text to write to the clipboard.
		 */
		readonly setClipboard: (text: string) => Effect.Effect<void, ClipboardError>;
		readonly pasteTextFromClipboard: Effect.Effect<void, ClipboardError>;
	}
>() {}

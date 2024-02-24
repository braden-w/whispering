import type { Effect } from 'effect';
import { Context, Data } from 'effect';

export class ClipboardError extends Data.TaggedError('TranscribeError')<{
	message: string;
	origError?: unknown;
}> {}

export class ClipboardService extends Context.Tag('ClipboardService')<
	ClipboardService,
	{
		/***
		 * Reads text from the user's clipboard.
		 * @returns The text from the clipboard.
		 */
		readonly getClipboard: Effect.Effect<string, ClipboardError>;
		/**
		 * Writes text to the user's clipboard.
		 * @param text The text to write to the clipboard.
		 */
		readonly setClipboard: (text: string) => Effect.Effect<void, ClipboardError>;
		/**
		 * Pastes text from the user's clipboard.
		 * - Web: No need to implement this function.
		 * - Desktop: This function should trigger a paste action, as if the user had pressed `Ctrl` + `V`.
		 * - Mobile: This function should trigger a paste action, as if the user had pressed `Paste` in the context menu.
		 */
		readonly pasteTextFromClipboard: Effect.Effect<void, ClipboardError>;
	}
>() {}

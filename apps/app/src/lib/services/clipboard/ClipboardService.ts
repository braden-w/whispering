import { Err, type Ok } from '@epicenterhq/result';
import type { MaybePromise, WhisperingErrProperties } from '@repo/shared';
import { createClipboardServiceDesktopLive } from './ClipboardServiceDesktopLive';
import { createClipboardServiceWebLive } from './ClipboardServiceWebLive';

type ClipboardErrorProperties = {
	_tag: 'ClipboardError';
	message: string;
	error: unknown;
};

export type ClipboardServiceErr = Err<
	ClipboardErrorProperties | WhisperingErrProperties
>;

export type ClipboardServiceResult<T> = Ok<T> | ClipboardServiceErr;

export const ClipboardServiceErr = (args: {
	message: string;
	error: unknown;
}): ClipboardServiceErr => {
	return Err({ _tag: 'ClipboardError', ...args });
};

export type ClipboardService = {
	/**
	 * Writes text to the user's clipboard.
	 * @param text The text to write to the clipboard.
	 */
	setClipboardText: (text: string) => Promise<ClipboardServiceResult<void>>;

	/**
	 * Pastes text from the user's clipboard.
	 * - Web: No need to implement this function.
	 * - Desktop: This function should trigger a paste action, as if the user had pressed `Ctrl` + `V`.
	 * - Mobile: This function should trigger a paste action, as if the user had pressed `Paste` in the context menu.
	 */
	writeTextToCursor: (
		text: string,
	) => MaybePromise<ClipboardServiceResult<void>>;
};

export const ClipboardService = window.__TAURI_INTERNALS__
	? createClipboardServiceDesktopLive()
	: createClipboardServiceWebLive();

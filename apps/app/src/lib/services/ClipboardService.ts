import type { WhisperingResult } from '@repo/shared';
import { createClipboardServiceDesktopLive } from './ClipboardServiceDesktopLive';
import { createClipboardServiceWebLive } from './ClipboardServiceWebLive';

export type ClipboardService = {
	/**
	 * Writes text to the user's clipboard.
	 * @param text The text to write to the clipboard.
	 */
	readonly setClipboardText: (text: string) => Promise<WhisperingResult<void>>;
	/**
	 * Pastes text from the user's clipboard.
	 * - Web: No need to implement this function.
	 * - Desktop: This function should trigger a paste action, as if the user had pressed `Ctrl` + `V`.
	 * - Mobile: This function should trigger a paste action, as if the user had pressed `Paste` in the context menu.
	 */
	readonly writeTextToCursor: (
		text: string,
	) => Promise<WhisperingResult<void>> | WhisperingResult<void>;
};

export const ClipboardService = window.__TAURI_INTERNALS__
	? createClipboardServiceDesktopLive()
	: createClipboardServiceWebLive();

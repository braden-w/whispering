import { createServiceErrorFns, type ServiceFn } from '@epicenterhq/result';
import { createClipboardServiceDesktopLive } from './ClipboardServiceDesktopLive';
import { createClipboardServiceWebLive } from './ClipboardServiceWebLive';
import type { WhisperingErrProperties } from '@repo/shared';

type ClipboardErrorProperties = {
	_tag: 'ClipboardError';
	message: string;
	error: unknown;
};

const { Err: ClipboardServiceError, tryAsync: tryAsyncClipboardService } =
	createServiceErrorFns<ClipboardErrorProperties>();
export { ClipboardServiceError, tryAsyncClipboardService };

export type ClipboardService = {
	/**
	 * Writes text to the user's clipboard.
	 * @param text The text to write to the clipboard.
	 */
	setClipboardText: ServiceFn<
		string,
		void,
		ClipboardErrorProperties | WhisperingErrProperties
	>;

	/**
	 * Pastes text from the user's clipboard.
	 * - Web: No need to implement this function.
	 * - Desktop: This function should trigger a paste action, as if the user had pressed `Ctrl` + `V`.
	 * - Mobile: This function should trigger a paste action, as if the user had pressed `Paste` in the context menu.
	 */
	writeTextToCursor: ServiceFn<
		string,
		void,
		ClipboardErrorProperties | WhisperingErrProperties
	>;
};

export const ClipboardService = window.__TAURI_INTERNALS__
	? createClipboardServiceDesktopLive()
	: createClipboardServiceWebLive();

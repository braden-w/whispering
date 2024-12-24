import { Ok } from '@epicenterhq/result';
import { WhisperingErr, tryAsyncWhispering } from '@repo/shared';
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { type } from '@tauri-apps/plugin-os';
import {
	type ClipboardService,
	tryAsyncClipboardService,
} from './ClipboardService';

const writeTextToCursor = (text: string) =>
	tryAsyncClipboardService({
		try: () => invoke<void>('write_text', { text }),
		catch: (error) => ({
			_tag: 'ClipboardError',
			message:
				'There was an error pasting from the clipboard using the Tauri Invoke API. Please try again.',
			error,
		}),
	});

export const createClipboardServiceDesktopLive = (): ClipboardService => ({
	async setClipboardText(text) {
		return await tryAsyncClipboardService({
			try: () => writeText(text),
			catch: (error) => ({
				_tag: 'ClipboardError',
				message:
					'There was an error writing to the clipboard using the Tauri Clipboard Manager API. Please try again.',
				error,
			}),
		});
	},

	async writeTextToCursor(text) {
		const isMacos = type() === 'macos';

		if (!isMacos) {
			const result = await writeTextToCursor(text);
			if (!result.ok) {
				return result;
			}
			return Ok(undefined);
		}

		const isAccessibilityEnabledResult = await tryAsyncWhispering({
			try: () =>
				invoke<boolean>('is_macos_accessibility_enabled', {
					askIfNotAllowed: false,
				}),
			catch: (error) => ({
				_tag: 'WhisperingError',
				title: 'Unable to ensure accessibility is enabled',
				description:
					'There was an error checking if accessibility is enabled using the Tauri Invoke API. Please try again.',
				action: { type: 'more-details', error },
			}),
		});

		if (!isAccessibilityEnabledResult.ok) {
			return isAccessibilityEnabledResult;
		}
		const isAccessibilityEnabled = isAccessibilityEnabledResult.data;

		if (!isAccessibilityEnabled) {
			return WhisperingErr({
				_tag: 'WhisperingError',
				isWarning: true,
				title:
					'Please enable or re-enable accessibility to paste transcriptions!',
				description:
					'Accessibility must be enabled or re-enabled for Whispering after install or update. Follow the link below for instructions.',
				action: {
					type: 'link',
					label: 'Open Directions',
					goto: '/macos-enable-accessibility',
				},
			});
		}

		const result = await writeTextToCursor(text);
		if (!result.ok) return result;

		return Ok(undefined);
	},
});

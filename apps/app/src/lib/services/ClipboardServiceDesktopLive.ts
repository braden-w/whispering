import { Err, WhisperingError, tryAsync } from '@repo/shared';
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { type } from '@tauri-apps/plugin-os';
import type { ClipboardService } from './ClipboardService';

const writeTextToCursor = (text: string) =>
	tryAsync({
		try: () => invoke<void>('write_text', { text }),
		catch: (error) =>
			new WhisperingError({
				title: 'Unable to paste from clipboard',
				description:
					'There was an error pasting from the clipboard using the Tauri Invoke API. Please try again.',
				action: { type: 'more-details', error },
			}),
	});

export const createClipboardServiceDesktopLive = (): ClipboardService => ({
	setClipboardText: (text: string) =>
		tryAsync({
			try: () => writeText(text),
			catch: (error) => ({
				_tag: 'WhisperingError',
				title: 'Unable to write to clipboard',
				description:
					'There was an error writing to the clipboard using the Tauri Clipboard Manager API. Please try again.',
				action: {
					type: 'more-details',
					error,
				},
			}),
		}),

	writeTextToCursor: async (text) => {
		const isMacos = type() === 'macos';

		if (!isMacos) return writeTextToCursor(text);

		const isAccessibilityEnabledResult = await tryAsync({
			try: () =>
				invoke<boolean>('is_macos_accessibility_enabled', {
					askIfNotAllowed: false,
				}),
			catch: (error) =>
				new WhisperingError({
					title: 'Unable to ensure accessibility is enabled',
					description:
						'There was an error checking if accessibility is enabled using the Tauri Invoke API. Please try again.',
					action: {
						type: 'more-details',
						error,
					},
				}),
		});

		if (!isAccessibilityEnabledResult.ok) return isAccessibilityEnabledResult;
		const isAccessibilityEnabled = isAccessibilityEnabledResult.data;

		if (!isAccessibilityEnabled) {
			return Err({
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
		return writeTextToCursor(text);
	},
});

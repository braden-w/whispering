import { tryAsyncWhispering } from '@repo/shared';
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { type } from '@tauri-apps/plugin-os';
import type { ClipboardService } from './ClipboardService';

const writeTextToCursor = (text: string) =>
	tryAsyncWhispering({
		try: () => invoke<void>('write_text', { text }),
		catch: (error) => ({
			_tag: 'WhisperingError',
			title: 'Unable to paste from clipboard',
			description:
				'There was an error pasting from the clipboard using the Tauri Invoke API. Please try again.',
			action: { type: 'more-details', error },
		}),
	});

export const createClipboardServiceDesktopLive = (): ClipboardService => ({
	async setClipboardText(
		text: string,
		{ onMutate, onSuccess, onError, onSettled },
	) {
		onMutate(text);
		const result = await tryAsyncWhispering({
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
		});
		if (result.ok) {
			onSuccess();
		} else {
			onError(result.error);
		}
		onSettled();
	},

	async writeTextToCursor(text, { onMutate, onSuccess, onError, onSettled }) {
		onMutate(text);
		const isMacos = type() === 'macos';

		if (!isMacos) {
			const result = await writeTextToCursor(text);
			if (result.ok) {
				onSuccess();
			} else {
				onError(result.error);
			}
			onSettled();
			return;
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
			onError(isAccessibilityEnabledResult.error);
			onSettled();
			return;
		}
		const isAccessibilityEnabled = isAccessibilityEnabledResult.data;

		if (!isAccessibilityEnabled) {
			onError({
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
			onSettled();
			return;
		}

		const result = await writeTextToCursor(text);
		if (result.ok) {
			onSuccess();
		} else {
			onError(result.error);
		}
		onSettled();
	},
});

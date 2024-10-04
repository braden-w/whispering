import { ClipboardService } from '$lib/services/ClipboardService';
import { WhisperingError } from '@repo/shared';
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { type } from '@tauri-apps/plugin-os';
import { Effect, Layer } from 'effect';

const writeTextToCursor = (text: string) =>
	Effect.try({
		try: () => invoke('write_text', { text }),
		catch: (error) =>
			new WhisperingError({
				title: 'Unable to paste from clipboard',
				description:
					error instanceof Error ? error.message : 'Please try again.',
				error,
			}),
	});

export const ClipboardServiceDesktopLive = Layer.succeed(
	ClipboardService,
	ClipboardService.of({
		setClipboardText: (text: string) =>
			Effect.tryPromise({
				try: () => writeText(text),
				catch: (error) =>
					new WhisperingError({
						title: 'Unable to write to clipboard',
						description:
							error instanceof Error ? error.message : 'Please try again.',
						error,
					}),
			}),
		writeTextToCursor: (text) =>
			Effect.gen(function* () {
				const isMacos = type() === 'macos';

				if (!isMacos) return yield* writeTextToCursor(text);

				const isAccessibilityEnabled = yield* Effect.tryPromise({
					try: () =>
						invoke<boolean>('is_macos_accessibility_enabled', {
							askIfNotAllowed: false,
						}),
					catch: (error) =>
						new WhisperingError({
							title: 'Unable to ensure accessibility is enabled',
							description:
								error instanceof Error ? error.message : `Error: ${error}`,
							error,
						}),
				});
				if (!isAccessibilityEnabled) {
					return yield* new WhisperingError({
						variant: 'warning',
						title:
							'Please enable or re-enable accessibility to paste transcriptions!',
						description:
							'Accessibility must be enabled or re-enabled for Whispering after install or update. Follow the link below for instructions.',
						action: {
							label: 'Open Directions',
							goto: '/macos-enable-accessibility',
						},
					});
				}
				return yield* writeTextToCursor(text);
			}),
	}),
);

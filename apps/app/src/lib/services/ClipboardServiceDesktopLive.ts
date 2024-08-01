import { ClipboardService } from '$lib/services/ClipboardService';
import { WhisperingError } from '@repo/shared';
import { writeText } from '@tauri-apps/api/clipboard';
import { type } from '@tauri-apps/api/os';
import { invoke } from '@tauri-apps/api/tauri';
import { Effect, Layer } from 'effect';

const writeTextToClipboard = (text: string) =>
	Effect.tryPromise({
		try: () => writeText(text),
		catch: (error) =>
			new WhisperingError({
				title: 'Unable to write to clipboard',
				description: error instanceof Error ? error.message : 'Please try again.',
				error,
			}),
	});

export const ClipboardServiceDesktopLive = Layer.succeed(
	ClipboardService,
	ClipboardService.of({
		setClipboardText: (text) =>
			Effect.gen(function* () {
				const isMacos = (yield* Effect.promise(type)) === 'Darwin';

				if (!isMacos) return yield* writeTextToClipboard(text);

				const isAccessibilityEnabled = yield* Effect.tryPromise({
					try: () =>
						invoke<boolean>('is_macos_accessibility_enabled', {
							askIfNotAllowed: false,
						}),
					catch: (error) =>
						new WhisperingError({
							title: 'Unable to ensure accessibility is enabled',
							description: error instanceof Error ? error.message : `Error: ${error}`,
							error,
						}),
				});
				if (!isAccessibilityEnabled) {
					return yield* new WhisperingError({
						variant: 'warning',
						title: 'Please enable or re-enable accessibility to paste transcriptions!',
						description:
							'Accessibility must be enabled or re-enabled for Whispering after install or update. Follow the link below for instructions.',
						action: {
							label: 'Open Directions',
							goto: '/macos-enable-accessibility',
						},
					});
				}
				return yield* writeTextToClipboard(text);
			}),
		writeText: (text) =>
			Effect.try({
				try: () => invoke('write_text', { text }),
				catch: (error) =>
					new WhisperingError({
						title: 'Unable to paste from clipboard',
						description: error instanceof Error ? error.message : 'Please try again.',
						error,
					}),
			}),
	}),
);

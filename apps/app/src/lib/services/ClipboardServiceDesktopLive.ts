import { writeText } from '@tauri-apps/api/clipboard';
import { invoke } from '@tauri-apps/api/tauri';
import { Effect, Layer } from 'effect';
import { ClipboardService } from './ClipboardService';

export const ClipboardServiceDesktopLive = Layer.succeed(
	ClipboardService,
	ClipboardService.of({
		setClipboardText: (text) =>
			Effect.tryPromise({
				try: () => writeText(text),
				catch: (error) =>
					new WhisperingError({
						title: 'Unable to write to clipboard',
						description: error instanceof Error ? error.message : 'Please try again.',
						error,
					}),
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

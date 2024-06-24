import { WhisperingError } from '@repo/shared';
import { invoke } from '@tauri-apps/api/tauri';
import { Effect, Layer } from 'effect';
import { SetTrayIconService } from './SetTrayIconService';

export const SetTrayIconServiceDesktopLive = Layer.succeed(
	SetTrayIconService,
	SetTrayIconService.of({
		setTrayIcon: (recorderState) =>
			Effect.tryPromise({
				try: () => invoke('set_tray_icon', { recorderState }),
				catch: (error) =>
					new WhisperingError({
						variant: 'warning',
						title: `Could not set tray icon to ${recorderState} icon..`,
						description: error instanceof Error ? error.message : `Error: ${error}`,
						error,
					}),
			}),
	}),
);

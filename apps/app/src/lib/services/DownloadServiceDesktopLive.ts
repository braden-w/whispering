import { DownloadService } from '$lib/services/DownloadService';
import { getExtensionFromAudioBlob } from '$lib/utils';
import { WhisperingError } from '@repo/shared';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { Effect, Layer } from 'effect';

export const DownloadServiceDesktopLive = Layer.succeed(
	DownloadService,
	DownloadService.of({
		downloadBlob: ({ name, blob }) =>
			Effect.gen(function* () {
				const extension = getExtensionFromAudioBlob(blob);
				const path = yield* Effect.promise(() =>
					save({ filters: [{ name, extensions: [extension] }] }),
				);
				if (path === null) return;
				const contents = new Uint8Array(
					yield* Effect.promise(() => blob.arrayBuffer()),
				);
				yield* Effect.tryPromise({
					try: () => writeFile(path, contents),
					catch: (error) =>
						new WhisperingError({
							title: 'Error saving recording',
							description: 'Please try again.',
							error: error,
						}),
				});
			}),
	}),
);

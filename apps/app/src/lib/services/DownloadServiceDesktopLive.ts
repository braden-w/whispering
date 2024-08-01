import { DownloadService } from '$lib/services/DownloadService';
import { WhisperingError } from '@repo/shared';
import { save } from '@tauri-apps/api/dialog';
import { writeBinaryFile } from '@tauri-apps/api/fs';
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
				const contents = new Uint8Array(yield* Effect.promise(() => blob.arrayBuffer()));
				yield* Effect.tryPromise({
					try: () => writeBinaryFile({ path, contents }),
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

function getExtensionFromAudioBlob(blob: Blob) {
	const mimeType = blob.type.toLowerCase();
	const mimeIncludes = (...types: string[]) => types.some((type) => mimeType.includes(type));
	if (mimeIncludes('webm')) return 'webm';
	if (mimeIncludes('mp4', 'mpeg', 'mp4a')) return 'mp4';
	if (mimeIncludes('ogg', 'opus')) return 'ogg';
	if (mimeIncludes('wav', 'wave')) return 'wav';
	if (mimeIncludes('aac')) return 'aac';
	if (mimeIncludes('flac')) return 'flac';
	return 'mp3';
}

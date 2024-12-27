import { getExtensionFromAudioBlob } from '$lib/utils';
import { Ok, tryAsync } from '@epicenterhq/result';
import { WhisperingErr } from '@repo/shared';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import type { DownloadService } from './DownloadService';

export function createDownloadServiceDesktop(): DownloadService {
	return {
		downloadBlob: async ({ name, blob }) => {
			const extension = getExtensionFromAudioBlob(blob);
			const saveResult = await tryAsync({
				try: async () => {
					const path = await save({
						filters: [{ name, extensions: [extension] }],
					});
					return path;
				},
				mapErr: (error) =>
					WhisperingErr({
						title: 'Error saving recording',
						description:
							'There was an error saving the recording using the Tauri Filesystem API. Please try again.',
						action: { type: 'more-details', error },
					}),
			});
			if (!saveResult.ok) return saveResult;
			const path = saveResult.data;
			if (path === null) {
				return WhisperingErr({
					title: 'Error saving recording',
					description:
						'There was an error saving the recording using the Tauri Filesystem API. Please try again.',
					action: { type: 'more-details', error: 'path is null' },
				});
			}
			const writeResult = await tryAsync({
				try: async () => {
					const contents = new Uint8Array(await blob.arrayBuffer());
					await writeFile(path, contents);
				},
				mapErr: (error) =>
					WhisperingErr({
						title: 'Error saving recording',
						description:
							'There was an error saving the recording using the Tauri Filesystem API. Please try again.',
						action: { type: 'more-details', error },
					}),
			});
			if (!writeResult.ok) return writeResult;
			return Ok(undefined);
		},
	};
}

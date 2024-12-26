import { getExtensionFromAudioBlob } from '$lib/utils';
import { Ok, tryAsync } from '@epicenterhq/result';
import { WhisperingErr, type WhisperingResult } from '@repo/shared';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

export type DownloadService = {
	downloadBlob: (args: {
		name: string;
		blob: Blob;
	}) => Promise<WhisperingResult<void>>;
};

export const DownloadService = window.__TAURI_INTERNALS__
	? createDownloadServiceDesktopLive()
	: createDownloadServiceWebLive();

function createDownloadServiceDesktopLive(): DownloadService {
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

function createDownloadServiceWebLive(): DownloadService {
	return {
		downloadBlob: ({ name, blob }) =>
			tryAsync({
				try: async () => {
					const file = new File([blob], name, { type: blob.type });
					const url = URL.createObjectURL(file);
					const a = document.createElement('a');
					a.href = url;
					a.download = name;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(url);
				},
				mapErr: (error) =>
					WhisperingErr({
						title: 'Error saving recording',
						description:
							'There was an error saving the recording in your browser. Please try again.',
						action: { type: 'more-details', error },
					}),
			}),
	};
}

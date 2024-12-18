import { getExtensionFromAudioBlob } from '$lib/utils';
import { type Result, tryAsync, trySync } from '@repo/shared';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

type DownloadService = {
	readonly downloadBlob: (config: {
		name: string;
		blob: Blob;
	}) => Promise<Result<void>> | Result<void>;
};

export const DownloadService = window.__TAURI_INTERNALS__
	? createDownloadServiceDesktopLive()
	: createDownloadServiceWebLive();

function createDownloadServiceDesktopLive(): DownloadService {
	return {
		async downloadBlob({ name, blob }) {
			const extension = getExtensionFromAudioBlob(blob);
			return await tryAsync({
				try: async () => {
					const path = await save({
						filters: [{ name, extensions: [extension] }],
					});
					if (path === null) return;
					const contents = new Uint8Array(await blob.arrayBuffer());
					return writeFile(path, contents);
				},
				catch: (error) => ({
					_tag: 'WhisperingError',
					title: 'Error saving recording',
					description:
						'There was an error saving the recording using the Tauri Filesystem API. Please try again.',
					action: { type: 'more-details', error },
				}),
			});
		},
	};
}

function createDownloadServiceWebLive(): DownloadService {
	return {
		downloadBlob: ({ name, blob }) =>
			trySync({
				try: () => {
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
				catch: (error) => ({
					_tag: 'WhisperingError',
					title: 'Error saving recording',
					description:
						'There was an error saving the recording in your browser. Please try again.',
					action: {
						type: 'more-details',
						error,
					},
				}),
			}),
	};
}

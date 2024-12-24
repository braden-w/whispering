import { getExtensionFromAudioBlob } from '$lib/utils';
import {
	type ServiceFn,
	createServiceErrorFns,
} from '@repo/shared/epicenter-result';
import type { WhisperingErrProperties } from '@repo/shared';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

type DownloadServiceErrorProperties = WhisperingErrProperties & {
	_tag: 'DownloadServiceError';
};

type DownloadService = {
	downloadBlob: ServiceFn<
		{ name: string; blob: Blob },
		void,
		DownloadServiceErrorProperties
	>;
};

const { tryAsync: tryAsyncDownloadService } =
	createServiceErrorFns<DownloadServiceErrorProperties>();

export const DownloadService = window.__TAURI_INTERNALS__
	? createDownloadServiceDesktopLive()
	: createDownloadServiceWebLive();

function createDownloadServiceDesktopLive(): DownloadService {
	return {
		async downloadBlob({ name, blob }) {
			const extension = getExtensionFromAudioBlob(blob);
			return await tryAsyncDownloadService({
				try: async () => {
					const path = await save({
						filters: [{ name, extensions: [extension] }],
					});
					if (path === null) return;
					const contents = new Uint8Array(await blob.arrayBuffer());
					return writeFile(path, contents);
				},
				mapErr: (error) => ({
					_tag: 'DownloadServiceError',
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
			tryAsyncDownloadService({
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
				mapErr: (error) => ({
					_tag: 'DownloadServiceError',
					title: 'Error saving recording',
					description:
						'There was an error saving the recording in your browser. Please try again.',
					action: { type: 'more-details', error },
				}),
			}),
	};
}

import type { WhisperingResult } from '@repo/shared';

export type DownloadService = {
	downloadBlob: (args: {
		name: string;
		blob: Blob;
	}) => Promise<WhisperingResult<void>>;
};

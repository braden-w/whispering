import type { WhisperingError } from '@repo/shared';
import type { Effect } from 'effect';
import { Context } from 'effect';

export class DownloadService extends Context.Tag('DownloadService')<
	DownloadService,
	{
		readonly downloadBlob: (config: {
			name: string;
			blob: Blob;
		}) => Effect.Effect<void, WhisperingError>;
	}
>() {}

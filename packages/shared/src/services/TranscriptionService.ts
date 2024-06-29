import type { SupportedLanguage, WhisperingError } from '@repo/shared';
import type { Effect } from 'effect';
import { Context } from 'effect';

export class TranscriptionService extends Context.Tag('TranscriptionService')<
	TranscriptionService,
	{
		readonly supportedLanguages: readonly { label: string; value: string }[];
		readonly transcribe: (
			blob: Blob,
			options: { apiKey: string; outputLanguage: SupportedLanguage },
		) => Effect.Effect<string, WhisperingError>;
	}
>() {}

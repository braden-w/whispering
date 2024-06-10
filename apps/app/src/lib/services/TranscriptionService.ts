import type { Effect } from 'effect';
import { Context, Data } from 'effect';
import type { WhisperingErrorProperties } from './errors';

export class TranscriptionError extends Data.TaggedError(
	'TranscriptionError',
)<WhisperingErrorProperties> {}

export class TranscriptionService extends Context.Tag('TranscriptionService')<
	TranscriptionService,
	{
		readonly supportedLanguages: readonly { label: string; value: string }[];
		readonly transcribe: (
			blob: Blob,
			options: { apiKey: string; outputLanguage: string },
		) => Effect.Effect<string, TranscriptionError>;
	}
>() {}

import type { Effect } from 'effect';
import { Context, Data } from 'effect';

export class TranscriptionError extends Data.TaggedError('TranscriptionError')<{
	message: string;
	origError?: unknown;
}> {}

export class PleaseEnterApiKeyError extends Data.TaggedError('PleaseEnterApiKeyError') {}

export class InvalidApiKeyError extends Data.TaggedError('InvalidApiKeyError') {}

export class TranscriptionService extends Context.Tag('TranscriptionService')<
	TranscriptionService,
	{
		readonly transcribe: (
			blob: Blob,
			options: { apiKey: string }
		) => Effect.Effect<string, TranscriptionError | PleaseEnterApiKeyError | InvalidApiKeyError>;
	}
>() {}

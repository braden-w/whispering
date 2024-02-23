import type { Effect } from 'effect';
import { Context, Data } from 'effect';

export class TranscriptionError extends Data.TaggedError('TranscribeError')<{
	message: string;
	origError?: unknown;
}> {}

export class TranscriptionService extends Context.Tag('TranscriptionService')<
	TranscriptionService,
	{
		readonly transcribe: (
			blob: Blob,
			options: { apiKey: string }
		) => Effect.Effect<string, TranscriptionError>;
	}
>() {}

import type { Effect } from 'effect';
import { Context, Data } from 'effect';

export class TranscriptionService extends Context.Tag('TranscriptionService')<
	TranscriptionService,
	{
		readonly transcribe: (blob: Blob) => Effect.Effect<string, TranscriptionError>;
	}
>() {}

export class TranscriptionError extends Data.TaggedError('TranscribeError')<{
	message: string;
	origError?: unknown;
}> {}

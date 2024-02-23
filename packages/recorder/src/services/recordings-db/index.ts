import type { Effect } from 'effect';
import { Context, Data } from 'effect';

/**
 * A recording
 * 1. Begins in an 'UNPROCESSED' state
 * 2. Moves to 'TRANSCRIBING' while the audio is being transcribed
 * 3. Finally is marked as 'DONE' when the transcription is complete.
 */
type RecordingState = 'UNPROCESSED' | 'TRANSCRIBING' | 'DONE';

export type Recording = {
	id: string;
	title: string;
	subtitle: string;
	transcription: string;
	blob: Blob;
	state: RecordingState;
};

export class RecordingsDbService extends Context.Tag('RecordingsDbService')<
	RecordingsDbService,
	{
		readonly getAllRecordings: Effect.Effect<Recording[], GetAllRecordingsError>;
		readonly getRecording: (id: string) => Effect.Effect<Recording | undefined, GetRecordingError>;
		readonly addRecording: (recording: Recording) => Effect.Effect<void, AddRecordingError>;
		readonly editRecording: (recording: Recording) => Effect.Effect<void, EditRecordingError>;
		readonly deleteRecording: (id: string) => Effect.Effect<void, DeleteRecordingError>;
	}
>() {}

export class GetAllRecordingsError extends Data.TaggedError('GetAllRecordingsError')<{
	message: string;
	origError: unknown;
}> {}

export class GetRecordingError extends Data.TaggedError('GetRecordingError')<{
	message: string;
	origError: unknown;
}> {}

export class AddRecordingError extends Data.TaggedError('AddRecordingError')<{
	message: string;
	origError: unknown;
}> {}

export class EditRecordingError extends Data.TaggedError('EditRecordingError')<{
	message: string;
	origError: unknown;
}> {}

export class DeleteRecordingError extends Data.TaggedError('DeleteRecordingError')<{
	message: string;
	origError: unknown;
}> {}

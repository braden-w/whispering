import type { Effect } from 'effect';
import { Context, Data } from 'effect';

/**
 * A recording
 * 1. Begins in an 'UNPROCESSED' state
 * 2. Moves to 'TRANSCRIBING' while the audio is being transcribed
 * 3. Finally is marked as 'DONE' when the transcription is complete.
 */
export type RecordingState = 'UNPROCESSED' | 'TRANSCRIBING' | 'DONE';

export type Recording = {
	id: string;
	title: string;
	subtitle: string;
	transcription: string;
	src: string;
	state: RecordingState;
};

export class RecordingsDb extends Context.Tag('Random')<
	RecordingsDb,
	{
		readonly getRecordings: Effect.Effect<Recording[], GetRecordingsError>;
		readonly addRecording: Effect.Effect<Recording, AddRecordingError>;
		readonly editRecording: Effect.Effect<Recording, EditRecordingError>;
		readonly deleteRecording: Effect.Effect<string, DeleteRecordingError>;
	}
>() {}

export class GetRecordingsError extends Data.TaggedError('GetRecordingsError')<{
	origError: unknown;
}> {}

export class AddRecordingError extends Data.TaggedError('AddRecordingError')<{
	origError: unknown;
}> {}

export class EditRecordingError extends Data.TaggedError('EditRecordingError')<{
	origError: unknown;
}> {}

export class DeleteRecordingError extends Data.TaggedError('DeleteRecordingError')<{
	origError: unknown;
}> {}

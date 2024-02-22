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

export class RecordingsDb extends Context.Tag('RecordingsDb')<
	RecordingsDb,
	{
		readonly getAllRecordings: Effect.Effect<Recording[], GetAllRecordingsError>;
		readonly getRecording: (id: string) => Effect.Effect<Recording | undefined, GetRecordingError>;
		readonly addRecording: (recording: Recording) => Effect.Effect<void, AddRecordingError>;
		readonly editRecording: (
			id: string,
			recording: Recording
		) => Effect.Effect<void, EditRecordingError>;
		readonly deleteRecording: (id: string) => Effect.Effect<void, DeleteRecordingError>;
		readonly transcribeRecording: (id: string) => Effect.Effect<void, TranscribeRecordingError>;
	}
>() {}

export class GetAllRecordingsError extends Data.TaggedError('GetRecordingsError')<{
	origError: unknown;
}> {}

export class GetRecordingError extends Data.TaggedError('GetRecordingError')<{
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

export class TranscribeRecordingError extends Data.TaggedError('TranscribeRecordingError')<{
	origError: unknown;
}> {}

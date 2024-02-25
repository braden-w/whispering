import type { Effect } from 'effect';
import { Context, Data } from 'effect';
import { Brand } from 'effect';

type RecordingState = 'UNPROCESSED' | 'TRANSCRIBING' | 'DONE';

export type Recording = {
	id: string;
	title: string;
	subtitle: string;
	transcribedText: string;
	blob: Blob;
	/**
	 * A recording
	 * 1. Begins in an 'UNPROCESSED' state
	 * 2. Moves to 'TRANSCRIBING' while the audio is being transcribed
	 * 3. Finally is marked as 'DONE' when the transcription is complete.
	 */
	state: RecordingState;
};

export type RecordingDbSuccessMessage<T = undefined> = {
	message: string;
	result?: T;
};

export class RecordingDbError extends Data.TaggedError('RecordingDbError')<{
	message: string;
	origError: unknown;
}> {}

export class GetAllRecordingsError extends RecordingDbError {
	constructor({ message, origError }: { message: string; origError: unknown }) {
		super({ message, origError });
	}
}

export class GetRecordingError extends RecordingDbError {
	constructor({ message, origError }: { message: string; origError: unknown }) {
		super({ message, origError });
	}
}

export class AddRecordingError extends RecordingDbError {
	constructor({ message, origError }: { message: string; origError: unknown }) {
		super({ message, origError });
	}
}

export class EditRecordingError extends RecordingDbError {
	constructor({ message, origError }: { message: string; origError: unknown }) {
		super({ message, origError });
	}
}

export class DeleteRecordingError extends RecordingDbError {
	constructor({ message, origError }: { message: string; origError: unknown }) {
		super({ message, origError });
	}
}

export class RecordingsDbService extends Context.Tag('RecordingsDbService')<
	RecordingsDbService,
	{
		readonly getAllRecordings: Effect.Effect<
			RecordingDbSuccessMessage<Recording[]>,
			GetAllRecordingsError
		>;
		readonly getRecording: (
			id: string
		) => Effect.Effect<RecordingDbSuccessMessage<Recording | undefined>, GetRecordingError>;
		readonly addRecording: (
			recording: Recording
		) => Effect.Effect<RecordingDbSuccessMessage, AddRecordingError>;
		readonly editRecording: (
			recording: Recording
		) => Effect.Effect<RecordingDbSuccessMessage, EditRecordingError>;
		readonly deleteRecording: (
			id: string
		) => Effect.Effect<RecordingDbSuccessMessage, DeleteRecordingError>;
	}
>() {}

import { writable } from 'svelte/store';
import { openDB, deleteDB, wrap, unwrap } from 'idb';
import { Context, Data, type Effect } from 'effect';
import type { Recording } from '../recordingState';

const DB_NAME = 'RecordingDB' as const;
const DB_VERSION = 1 as const;
const RECORDING_STORE = 'recordings' as const;

export class RecordingsDb extends Context.Tag('Random')<
	RecordingsDb,
	{
		readonly getRecordings: Effect.Effect<Recording[], GetRecordingsError>;
		readonly addRecording: Effect.Effect<Recording, AddRecordingError>;
		readonly editRecording: Effect.Effect<Recording, EditRecordingError>;
		readonly deleteRecording: Effect.Effect<string, DeleteRecordingError>;
	}
>() {}

export class GetRecordingsError extends Data.TaggedError('GetRecordingsError') {}

export class AddRecordingError extends Data.TaggedError('AddRecordingError')<{
	origError: unknown;
}> {}

export class EditRecordingError extends Data.TaggedError('EditRecordingError') {}

export class DeleteRecordingError extends Data.TaggedError('DeleteRecordingError') {}

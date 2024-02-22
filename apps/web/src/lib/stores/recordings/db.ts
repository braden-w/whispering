import {
	AddRecordingError,
	DeleteRecordingError,
	EditRecordingError,
	GetAllRecordingsError,
	GetRecordingError,
	RecordingsDb,
	type Recording,
	RecordingIdToBlobError
} from '@repo/recorder';
import { Effect } from 'effect';
import { openDB, type DBSchema } from 'idb';

const DB_NAME = 'RecordingDB' as const;
const DB_VERSION = 1 as const;
const RECORDING_STORE = 'recordings' as const;

interface RecordingDb extends DBSchema {
	recordings: {
		key: Recording['id'];
		value: Recording;
	};
}

const runnable = Effect.provideService(program, RecordingsDb, {
	addRecording: (recording) =>
		Effect.tryPromise({
			try: async () => {
				const db = await openDB<RecordingDb>(DB_NAME, DB_VERSION);
				await db.add(RECORDING_STORE, recording, recording.id);
			},
			catch: (error) => new AddRecordingError({ origError: error })
		}),
	editRecording: (id, recording) =>
		Effect.tryPromise({
			try: async () => {
				const db = await openDB<RecordingDb>(DB_NAME, DB_VERSION);
				await db.put(RECORDING_STORE, recording, id);
			},
			catch: (error) => new EditRecordingError({ origError: error })
		}),
	deleteRecording: (id) =>
		Effect.tryPromise({
			try: async () => {
				const db = await openDB<RecordingDb>(DB_NAME, DB_VERSION);
				await db.delete(RECORDING_STORE, id);
			},
			catch: (error) => new DeleteRecordingError({ origError: error })
		}),
	getAllRecordings: Effect.tryPromise({
		try: async () => {
			const db = await openDB<RecordingDb>(DB_NAME, DB_VERSION);
			return db.getAll(RECORDING_STORE);
		},
		catch: (error) => new GetAllRecordingsError({ origError: error })
	}),
	getRecording: (id) =>
		Effect.tryPromise({
			try: async () => {
				const db = await openDB<RecordingDb>(DB_NAME, DB_VERSION);
				return db.get(RECORDING_STORE, id);
			},
			catch: (error) => new GetRecordingError({ origError: error })
		}),
	recordingIdToBlob: (id) =>
		Effect.tryPromise({
			try: async () => {
				const db = await openDB<RecordingDb>(DB_NAME, DB_VERSION);
				const record = await db.get(RECORDING_STORE, id);
				if (!record) throw new Error(`No recording with id ${id}`);
				return fetch(record.src).then((res) => res.blob());
			},
			catch: (error) => new RecordingIdToBlobError({ origError: error })
		})
});

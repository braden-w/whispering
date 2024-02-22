import { Effect } from 'effect';
import { AddRecordingError, RecordingsDb, type Recording } from '@repo/recorder';
import { openDB, type DBSchema } from 'idb';

const DB_NAME = 'RecordingDB' as const;
const DB_VERSION = 1 as const;
const RECORDING_STORE = 'recordings' as const;

interface RecordingDb extends DBSchema {
	recordings: {
		key: string;
		value: Recording;
	};
}

const runnable = Effect.provideService(program, RecordingsDb, {
	addRecording: Effect.tryPromise({
		try: async (recording) => {
			const db = await openDB<RecordingDb>(DB_NAME, DB_VERSION);
			const tx = db.transaction(RECORDING_STORE, 'readwrite');
			const store = tx.objectStore(RECORDING_STORE);
			store.add(recording);
			await tx.done;
		},
		catch: (error) => new AddRecordingError({ origError: error })
	}),
	editRecording: Effect.tryPromise({
		try: async (id, recording) => {
			const db = await openDB<RecordingDb>(DB_NAME, DB_VERSION);
			const tx = db.transaction(RECORDING_STORE, 'readwrite');
			const store = tx.objectStore(RECORDING_STORE);
			store.put(recording, id);
			await tx.done;
		},
		catch: (error) => new AddRecordingError({ origError: error })
	}),
	deleteRecording: Effect.tryPromise({
		try: async (id) => {
			const db = await openDB<RecordingDb>(DB_NAME, DB_VERSION);
			const tx = db.transaction(RECORDING_STORE, 'readwrite');
			const store = tx.objectStore(RECORDING_STORE);
			store.delete(id);
			await tx.done;
		},
		catch: (error) => new AddRecordingError({ origError: error })
	}),
	getRecording: Effect.tryPromise({
		try: async (id) => {
			const db = await openDB<RecordingDb>(DB_NAME, DB_VERSION);
			const tx = db.transaction(RECORDING_STORE, 'readonly');
			const store = tx.objectStore(RECORDING_STORE);
			return store.get(id);
		},
		catch: (error) => new AddRecordingError({ origError: error })
	}),
	getAllRecordings: Effect.tryPromise({
		try: async () => {
			const db = await openDB<RecordingDb>(DB_NAME, DB_VERSION);
			const tx = db.transaction(RECORDING_STORE, 'readonly');
			const store = tx.objectStore(RECORDING_STORE);
			return store.getAll();
		},
		catch: (error) => new AddRecordingError({ origError: error })
	})
});

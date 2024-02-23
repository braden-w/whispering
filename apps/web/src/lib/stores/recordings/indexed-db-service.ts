import type { RecordingsDbService } from '@repo/recorder';
import {
	AddRecordingError,
	DeleteRecordingError,
	EditRecordingError,
	GetAllRecordingsError,
	GetRecordingError,
	type Recording
} from '@repo/recorder';
import type { Context } from 'effect';
import { Effect } from 'effect';
import { openDB, type DBSchema } from 'idb';

const DB_NAME = 'RecordingDB' as const;
const DB_VERSION = 1 as const;
const RECORDING_STORE = 'recordings' as const;

interface RecordingsDbSchema extends DBSchema {
	recordings: {
		key: Recording['id'];
		value: Recording;
	};
}

export const indexedDbService: Context.Tag.Service<RecordingsDbService> = {
	addRecording: (recording) =>
		Effect.tryPromise({
			try: async () => {
				const db = await openDB<RecordingsDbSchema>(DB_NAME, DB_VERSION, {
					upgrade(db) {
						const isRecordingStoreObjectStoreExists = db.objectStoreNames.contains(RECORDING_STORE);
						if (!isRecordingStoreObjectStoreExists) {
							db.createObjectStore(RECORDING_STORE, { keyPath: 'id' });
						}
					}
				});
				await db.add(RECORDING_STORE, recording);
			},
			catch: (error) => new AddRecordingError({ origError: error })
		}),
	editRecording: (recording) =>
		Effect.tryPromise({
			try: async () => {
				const db = await openDB<RecordingsDbSchema>(DB_NAME, DB_VERSION, {
					upgrade(db) {
						const isRecordingStoreObjectStoreExists = db.objectStoreNames.contains(RECORDING_STORE);
						if (!isRecordingStoreObjectStoreExists) {
							db.createObjectStore(RECORDING_STORE, { keyPath: 'id' });
						}
					}
				});
				await db.put(RECORDING_STORE, recording);
			},
			catch: (error) => new EditRecordingError({ origError: error })
		}),
	deleteRecording: (id) =>
		Effect.tryPromise({
			try: async () => {
				const db = await openDB<RecordingsDbSchema>(DB_NAME, DB_VERSION, {
					upgrade(db) {
						const isRecordingStoreObjectStoreExists = db.objectStoreNames.contains(RECORDING_STORE);
						if (!isRecordingStoreObjectStoreExists) {
							db.createObjectStore(RECORDING_STORE, { keyPath: 'id' });
						}
					}
				});
				await db.delete(RECORDING_STORE, id);
			},
			catch: (error) => new DeleteRecordingError({ origError: error })
		}),
	getAllRecordings: Effect.tryPromise({
		try: async () => {
			const db = await openDB<RecordingsDbSchema>(DB_NAME, DB_VERSION, {
				upgrade(db) {
					const isRecordingStoreObjectStoreExists = db.objectStoreNames.contains(RECORDING_STORE);
					if (!isRecordingStoreObjectStoreExists) {
						db.createObjectStore(RECORDING_STORE, { keyPath: 'id' });
					}
				}
			});
			return db.getAll(RECORDING_STORE);
		},
		catch: (error) => new GetAllRecordingsError({ origError: error })
	}),
	getRecording: (id) =>
		Effect.tryPromise({
			try: async () => {
				const db = await openDB<RecordingsDbSchema>(DB_NAME, DB_VERSION, {
					upgrade(db) {
						const isRecordingStoreObjectStoreExists = db.objectStoreNames.contains(RECORDING_STORE);
						if (!isRecordingStoreObjectStoreExists) {
							db.createObjectStore(RECORDING_STORE, { keyPath: 'id' });
						}
					}
				});
				return db.get(RECORDING_STORE, id);
			},
			catch: (error) => new GetRecordingError({ origError: error })
		})
};

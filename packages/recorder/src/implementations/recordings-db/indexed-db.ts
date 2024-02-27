import type { Context } from 'effect';
import { Effect } from 'effect';
import { openDB, type DBSchema } from 'idb';
import type { Recording, RecordingsDbService } from '../../services/recordings-db';
import {
	AddRecordingError,
	DeleteRecordingError,
	EditRecordingError,
	GetAllRecordingsError,
	GetRecordingError
} from '../../services/recordings-db';

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
			catch: (error) =>
				new AddRecordingError({
					origError: error,
					message: `Error adding recording to indexedDB: ${error}`
				})
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
			catch: (error) =>
				new EditRecordingError({
					origError: error,
					message: `Error editing recording in indexedDB: ${error}`
				})
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
			catch: (error) =>
				new DeleteRecordingError({
					origError: error,
					message: `Error deleting recording from indexedDB: ${error}`
				})
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
		catch: (error) =>
			new GetAllRecordingsError({
				origError: error,
				message: `Error getting all recordings from indexedDB: ${error}`
			})
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
			catch: (error) =>
				new GetRecordingError({
					origError: error,
					message: `Error getting recording from indexedDB: ${error}`
				})
		})
};

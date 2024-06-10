import { Effect, Layer, Option } from 'effect';
import { openDB, type DBSchema } from 'idb';
import type { Recording } from './RecordingDbService';
import { RecordingDbError, RecordingsDbService } from './RecordingDbService';

const DB_NAME = 'RecordingDB' as const;
const DB_VERSION = 1 as const;
const RECORDING_STORE = 'recordings' as const;

interface RecordingsDbSchema extends DBSchema {
	recordings: {
		key: Recording['id'];
		value: Recording;
	};
}

export const RecordingsDbServiceLiveIndexedDb = Layer.effect(
	RecordingsDbService,
	Effect.sync(() => {
		const db = openDB<RecordingsDbSchema>(DB_NAME, DB_VERSION, {
			upgrade(db) {
				const isRecordingStoreObjectStoreExists = db.objectStoreNames.contains(RECORDING_STORE);
				if (!isRecordingStoreObjectStoreExists) {
					db.createObjectStore(RECORDING_STORE, { keyPath: 'id' });
				}
			},
		});
		return {
			addRecording: (recording) =>
				Effect.tryPromise({
					try: async () => (await db).add(RECORDING_STORE, recording),
					catch: (error) =>
						new RecordingDbError({
							title: 'Error adding recording to indexedDB',
							description: error instanceof Error ? error.message : undefined,
							error,
						}),
				}),
			updateRecording: (recording) =>
				Effect.tryPromise({
					try: async () => (await db).put(RECORDING_STORE, $state.snapshot(recording)),
					catch: (error) =>
						new RecordingDbError({
							title: 'Error editing recording in indexedDB',
							description: error instanceof Error ? error.message : undefined,
							error,
						}),
				}),
			deleteRecordingById: (id) =>
				Effect.tryPromise({
					try: async () => (await db).delete(RECORDING_STORE, id),
					catch: (error) =>
						new RecordingDbError({
							title: 'Error deleting recording from indexedDB',
							description: error instanceof Error ? error.message : undefined,
							error,
						}),
				}),
			deleteRecordingsById: (ids) =>
				Effect.tryPromise({
					try: async () => {
						const tx = (await db).transaction(RECORDING_STORE, 'readwrite');
						await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
					},
					catch: (error) =>
						new RecordingDbError({
							title: 'Error deleting recording from indexedDB',
							description: error instanceof Error ? error.message : undefined,
							error,
						}),
				}),
			getAllRecordings: Effect.tryPromise({
				try: async () => (await db).getAll(RECORDING_STORE),
				catch: (error) =>
					new RecordingDbError({
						title: 'Error getting all recordings from indexedDB',
						description: error instanceof Error ? error.message : undefined,
						error,
					}),
			}),
			getRecording: (id) =>
				Effect.tryPromise({
					try: async () => (await db).get(RECORDING_STORE, id),
					catch: (error) =>
						new RecordingDbError({
							title: 'Error getting recording from indexedDB',
							description: error instanceof Error ? error.message : undefined,
							error,
						}),
				}).pipe(Effect.map(Option.fromNullable)),
		};
	}),
);

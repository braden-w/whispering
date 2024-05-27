import { Option } from 'effect';
import { Effect, Layer } from 'effect';
import { openDB, type DBSchema } from 'idb';
import type { Recording } from '../../services/recordings-db';
import {
	AddRecordingError,
	DeleteRecordingError,
	EditRecordingError,
	GetAllRecordingsError,
	GetRecordingError,
	RecordingsDbService,
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

export const RecordingsDbServiceLiveIndexedDb = Layer.effect(
	RecordingsDbService,
	Effect.gen(function* (_) {
		const db = yield* _(
			Effect.tryPromise({
				try: async () => {
					const db = await openDB<RecordingsDbSchema>(DB_NAME, DB_VERSION, {
						upgrade(db) {
							const isRecordingStoreObjectStoreExists =
								db.objectStoreNames.contains(RECORDING_STORE);
							if (!isRecordingStoreObjectStoreExists) {
								db.createObjectStore(RECORDING_STORE, { keyPath: 'id' });
							}
						},
					});
					return db;
				},
				catch: (error) =>
					new AddRecordingError({
						origError: error,
						message: `Error initializing indexedDb: ${error}`,
					}),
			}),
		);
		return {
			addRecording: (recording) =>
				Effect.tryPromise({
					try: () => db.add(RECORDING_STORE, recording),
					catch: (error) =>
						new AddRecordingError({
							origError: error,
							message: `Error adding recording to indexedDB: ${error}`,
						}),
				}),
			updateRecording: (recording) =>
				Effect.tryPromise({
					try: () => db.put(RECORDING_STORE, $state.snapshot(recording)),
					catch: (error) =>
						new EditRecordingError({
							origError: error,
							message: `Error editing recording in indexedDB: ${error}`,
						}),
				}),
			deleteRecording: (id) =>
				Effect.tryPromise({
					try: () => db.delete(RECORDING_STORE, id),
					catch: (error) =>
						new DeleteRecordingError({
							origError: error,
							message: `Error deleting recording from indexedDB: ${error}`,
						}),
				}),
			getAllRecordings: Effect.tryPromise({
				try: () => db.getAll(RECORDING_STORE),
				catch: (error) =>
					new GetAllRecordingsError({
						origError: error,
						message: `Error getting all recordings from indexedDB: ${error}`,
					}),
			}),
			getRecording: (id) =>
				Effect.tryPromise({
					try: () => db.get(RECORDING_STORE, id),
					catch: (error) =>
						new GetRecordingError({
							origError: error,
							message: `Error getting recording from indexedDB: ${error}`,
						}),
				}).pipe(Effect.map(Option.fromNullable)),
		};
	}),
);

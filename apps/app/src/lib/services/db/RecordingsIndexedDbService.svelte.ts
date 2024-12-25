import { renderErrAsToast } from '$lib/services/renderErrorAsToast';
import { Ok, tryAsync } from '@epicenterhq/result';
import { type DBSchema, openDB } from 'idb';
import { DbError, type DbService, type Recording } from '.';

const DB_NAME = 'RecordingDB' as const;
const DB_VERSION = 2 as const;

const RECORDING_METADATA_STORE = 'recordingMetadata' as const;
const RECORDING_BLOB_STORE = 'recordingBlobs' as const;
const DEPRECATED_RECORDING_STORE = 'recordings' as const;

interface RecordingsDbSchemaV2 extends DBSchema {
	[RECORDING_METADATA_STORE]: {
		key: Recording['id'];
		value: Omit<Recording, 'blob'>;
	};
	[RECORDING_BLOB_STORE]: {
		key: Recording['id'];
		value: { id: Recording['id']; blob: Blob };
	};
}

interface RecordingsDbSchemaV1 extends DBSchema {
	[DEPRECATED_RECORDING_STORE]: {
		key: Recording['id'];
		value: Recording;
	};
}

type RecordingsDbSchema = RecordingsDbSchemaV2 & RecordingsDbSchemaV1;

export const createRecordingsIndexedDbService = (): DbService => {
	let recordings = $state<Recording[]>([]);

	const dbPromise = openDB<RecordingsDbSchema>(DB_NAME, DB_VERSION, {
		async upgrade(db, oldVersion, newVersion, transaction) {
			if (oldVersion === 0) {
				// Fresh install
				transaction.db.createObjectStore(RECORDING_METADATA_STORE, {
					keyPath: 'id',
				});
				transaction.db.createObjectStore(RECORDING_BLOB_STORE, {
					keyPath: 'id',
				});
			}

			if (oldVersion === 1 && newVersion === 2) {
				// Upgrade from v1 to v2
				const recordingsStore = transaction.objectStore(
					DEPRECATED_RECORDING_STORE,
				);
				const metadataStore = transaction.db.createObjectStore(
					RECORDING_METADATA_STORE,
					{
						keyPath: 'id',
					},
				);
				const blobStore = transaction.db.createObjectStore(
					RECORDING_BLOB_STORE,
					{
						keyPath: 'id',
					},
				);

				const recordings = await recordingsStore.getAll();
				await Promise.all(
					recordings.map(async (recording) => {
						const { blob, ...metadata } = recording;
						await Promise.all([
							metadataStore.add(metadata),
							blobStore.add({ id: recording.id, blob }),
						]);
					}),
				);

				// Delete the old store after migration
				transaction.db.deleteObjectStore(DEPRECATED_RECORDING_STORE);
				await transaction.done;
			}
		},
	});

	const syncDbToRecordingsState = async () => {
		const allRecordingsFromDbResult = await tryAsync({
			try: async () => {
				const tx = (await dbPromise).transaction(
					[RECORDING_METADATA_STORE, RECORDING_BLOB_STORE],
					'readonly',
				);
				const recordingMetadataStore = tx.objectStore(RECORDING_METADATA_STORE);
				const recordingBlobStore = tx.objectStore(RECORDING_BLOB_STORE);
				const metadata = await recordingMetadataStore.getAll();
				const blobs = await recordingBlobStore.getAll();
				await tx.done;
				return metadata
					.map((recording) => {
						const blob = blobs.find((blob) => blob.id === recording.id)?.blob;
						return blob ? { ...recording, blob } : null;
					})
					.filter((r) => r !== null);
			},
			mapErr: (error) =>
				DbError({
					title: 'Error getting recordings from indexedDB',
					description: 'Please try again',
					error,
				}),
		});
		if (!allRecordingsFromDbResult.ok) {
			return renderErrAsToast({
				variant: 'error',
				title: 'Failed to initialize recordings',
				description:
					'Unable to load your recordings from the database. This could be due to browser storage issues or corrupted data.',
				action: {
					type: 'more-details',
					error: allRecordingsFromDbResult.error,
				},
			});
		}
		recordings = allRecordingsFromDbResult.data;
	};

	syncDbToRecordingsState();

	return {
		get recordings() {
			return recordings;
		},

		async getRecording(id: string) {
			return tryAsync({
				try: async () => {
					const tx = (await dbPromise).transaction(
						[RECORDING_METADATA_STORE, RECORDING_BLOB_STORE],
						'readonly',
					);
					const recordingMetadataStore = tx.objectStore(
						RECORDING_METADATA_STORE,
					);
					const recordingBlobStore = tx.objectStore(RECORDING_BLOB_STORE);
					const metadata = await recordingMetadataStore.get(id);
					const blobData = await recordingBlobStore.get(id);
					await tx.done;
					if (metadata && blobData) {
						return { ...metadata, blob: blobData.blob };
					}
					return null;
				},
				mapErr: (error) =>
					DbError({
						title: 'Error getting recording from indexedDB',
						description: 'Please try again',
						error,
					}),
			});
		},

		async addRecording(recording: Recording) {
			const addRecordingResult = await tryAsync({
				try: async () => {
					const { blob, ...metadata } = recording;
					const tx = (await dbPromise).transaction(
						[RECORDING_METADATA_STORE, RECORDING_BLOB_STORE],
						'readwrite',
					);
					const recordingMetadataStore = tx.objectStore(
						RECORDING_METADATA_STORE,
					);
					const recordingBlobStore = tx.objectStore(RECORDING_BLOB_STORE);
					await Promise.all([
						recordingMetadataStore.add(metadata),
						recordingBlobStore.add({ id: recording.id, blob }),
						tx.done,
					]);
				},
				mapErr: (error) =>
					DbError({
						title: 'Error adding recording to indexedDB',
						description: 'Please try again',
						error,
					}),
			});
			if (!addRecordingResult.ok) return addRecordingResult;
			recordings.push(recording);
			return Ok(undefined);
		},

		async updateRecording(recording: Recording) {
			const updateRecordingResult = await tryAsync({
				try: async () => {
					const { blob, ...metadata } = recording;
					await Promise.all([
						(await dbPromise).put(RECORDING_METADATA_STORE, metadata),
						(await dbPromise).put(RECORDING_BLOB_STORE, {
							id: recording.id,
							blob,
						}),
					]);
				},
				mapErr: (error) =>
					DbError({
						title: 'Error updating recording in indexedDB',
						description: 'Please try again',
						error,
					}),
			});
			if (!updateRecordingResult.ok) return updateRecordingResult;
			recordings = recordings.map((r) =>
				r.id === recording.id ? recording : r,
			);
			return Ok(undefined);
		},

		async deleteRecordingById(id: string) {
			const deleteRecordingByIdResult = await tryAsync({
				try: async () => {
					const tx = (await dbPromise).transaction(
						[RECORDING_METADATA_STORE, RECORDING_BLOB_STORE],
						'readwrite',
					);
					const recordingMetadataStore = tx.objectStore(
						RECORDING_METADATA_STORE,
					);
					const recordingBlobStore = tx.objectStore(RECORDING_BLOB_STORE);
					await Promise.all([
						recordingMetadataStore.delete(id),
						recordingBlobStore.delete(id),
						tx.done,
					]);
				},
				mapErr: (error) =>
					DbError({
						title: 'Error deleting recording from indexedDB',
						description: 'Please try again',
						error,
					}),
			});
			if (!deleteRecordingByIdResult.ok) return deleteRecordingByIdResult;
			recordings = recordings.filter((r) => r.id !== id);
			return Ok(undefined);
		},

		async deleteRecordingsById(ids: string[]) {
			const deleteRecordingsByIdResult = await tryAsync({
				try: async () => {
					const tx = (await dbPromise).transaction(
						[RECORDING_METADATA_STORE, RECORDING_BLOB_STORE],
						'readwrite',
					);
					const recordingMetadataStore = tx.objectStore(
						RECORDING_METADATA_STORE,
					);
					const recordingBlobStore = tx.objectStore(RECORDING_BLOB_STORE);
					for (const id of ids) {
						await recordingMetadataStore.delete(id);
						await recordingBlobStore.delete(id);
					}
					await tx.done;
				},
				mapErr: (error) =>
					DbError({
						title: 'Error deleting recordings from indexedDB',
						description: 'Please try again',
						error,
					}),
			});
			if (!deleteRecordingsByIdResult.ok) return deleteRecordingsByIdResult;
			recordings = recordings.filter((r) => !ids.includes(r.id));
			return Ok(undefined);
		},
	};
};

import { tryAsyncWhispering } from '@repo/shared';
import { type DBSchema, openDB } from 'idb';
import type { Recording, RecordingsDbService } from './RecordingDbService';

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

export const createRecordingsDbServiceLiveIndexedDb =
	(): RecordingsDbService => {
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

		return {
			getAllRecordings: () =>
				tryAsyncWhispering({
					try: async () => {
						const tx = (await dbPromise).transaction(
							[RECORDING_METADATA_STORE, RECORDING_BLOB_STORE],
							'readonly',
						);
						const recordingMetadataStore = tx.objectStore(
							RECORDING_METADATA_STORE,
						);
						const recordingBlobStore = tx.objectStore(RECORDING_BLOB_STORE);
						const metadata = await recordingMetadataStore.getAll();
						const blobs = await recordingBlobStore.getAll();
						await tx.done;
						return metadata
							.map((recording) => {
								const blob = blobs.find(
									(blob) => blob.id === recording.id,
								)?.blob;
								return blob ? { ...recording, blob } : null;
							})
							.filter((r) => r !== null);
					},
					catch: (error) => ({
						_tag: 'WhisperingError',
						title: 'Error getting recordings from indexedDB',
						description: 'Please try again',
						action: {
							type: 'more-details',
							error,
						},
					}),
				}),
			getRecording: (id) =>
				tryAsyncWhispering({
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
					catch: (error) => ({
						_tag: 'WhisperingError',
						title: 'Error getting recording from indexedDB',
						description: 'Please try again',
						action: {
							type: 'more-details',
							error,
						},
					}),
				}),
			addRecording: (recording) =>
				tryAsyncWhispering({
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
					catch: (error) => ({
						_tag: 'WhisperingError',
						title: 'Error adding recording to indexedDB',
						description: 'Please try again',
						action: {
							type: 'more-details',
							error,
						},
					}),
				}),
			updateRecording: (recording) =>
				tryAsyncWhispering({
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
					catch: (error) => ({
						_tag: 'WhisperingError',
						title: 'Error updating recording in indexedDB',
						description: 'Please try again',
						action: {
							type: 'more-details',
							error,
						},
					}),
				}),
			deleteRecordingById: (id) =>
				tryAsyncWhispering({
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
					catch: (error) => ({
						_tag: 'WhisperingError',
						title: 'Error deleting recording from indexedDB',
						description: 'Please try again',
						action: {
							type: 'more-details',
							error,
						},
					}),
				}),
			deleteRecordingsById: (ids) =>
				tryAsyncWhispering({
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
					catch: (error) => ({
						_tag: 'WhisperingError',
						title: 'Error deleting recordings from indexedDB',
						description: 'Please try again',
						action: {
							type: 'more-details',
							error,
						},
					}),
				}),
		};
	};

import { Ok, tryAsync } from '@epicenterhq/result';
import type { Settings } from '@repo/shared';
import { type DBSchema, openDB } from 'idb';
import { toast } from '../../utils/toast';
import type { DbService } from './RecordingsService';
import { DbServiceErr, type Recording } from './RecordingsService';

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
		value: { id: Recording['id']; blob: Blob | undefined };
	};
}

interface RecordingsDbSchemaV1 extends DBSchema {
	[DEPRECATED_RECORDING_STORE]: { key: Recording['id']; value: Recording };
}

type RecordingsDbSchema = RecordingsDbSchemaV2 & RecordingsDbSchemaV1;

export function createRecordingsIndexedDbService(): DbService {
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
					{ keyPath: 'id' },
				);
				const blobStore = transaction.db.createObjectStore(
					RECORDING_BLOB_STORE,
					{ keyPath: 'id' },
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
				return metadata.map((recording) => {
					const blob = blobs.find((blob) => blob.id === recording.id)?.blob;
					return { ...recording, blob };
				});
			},
			mapErr: (error) =>
				DbServiceErr({
					title: 'Error getting recordings from indexedDB',
					description: 'Please try again',
					error,
				}),
		});
		if (!allRecordingsFromDbResult.ok) {
			toast.error({
				title: 'Failed to initialize recordings',
				description:
					'Unable to load your recordings from the database. This could be due to browser storage issues or corrupted data.',
				action: {
					type: 'more-details',
					error: allRecordingsFromDbResult.error,
				},
			});
			return;
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
					DbServiceErr({
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
					DbServiceErr({
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
					DbServiceErr({
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

		async deleteRecording(recording: Recording) {
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
						recordingMetadataStore.delete(recording.id),
						recordingBlobStore.delete(recording.id),
						tx.done,
					]);
				},
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error deleting recording from indexedDB',
						description: 'Please try again',
						error,
					}),
			});
			if (!deleteRecordingByIdResult.ok) return deleteRecordingByIdResult;
			recordings = recordings.filter((r) => r.id !== recording.id);
			return Ok(undefined);
		},

		async deleteRecordings(recordingsToDelete: Recording[]) {
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
					await Promise.all([
						...recordingsToDelete.map((recording) =>
							recordingMetadataStore.delete(recording.id),
						),
						...recordingsToDelete.map((recording) =>
							recordingBlobStore.delete(recording.id),
						),
					]);
					await tx.done;
				},
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error deleting recordings from indexedDB',
						description: 'Please try again',
						error,
					}),
			});
			if (!deleteRecordingsByIdResult.ok) return deleteRecordingsByIdResult;
			recordings = recordings.filter(
				(r) => !recordingsToDelete.some((toDelete) => toDelete.id === r.id),
			);
			return Ok(undefined);
		},

		async cleanupExpiredRecordings({
			recordingRetentionStrategy,
			recordingRetentionMinutes,
		}) {
			switch (recordingRetentionStrategy) {
				case 'keep-forever': {
					return Ok(undefined);
				}
				case 'never-save': {
					if (recordings.length === 0) return Ok(undefined);
					const deleteAllRecordingsResult =
						await this.deleteRecordings(recordings);
					if (!deleteAllRecordingsResult.ok) {
						return DbServiceErr({
							title: 'Unable to clean up recordings',
							description: 'Some recordings could not be deleted',
							error: deleteAllRecordingsResult.error,
						});
					}
					return Ok(undefined);
				}
				case 'expire-after-duration': {
					const expiredRecordings = recordings.filter((recording) => {
						const retentionMinutes = Number.parseInt(recordingRetentionMinutes);
						const recordingDate = new Date(recording.timestamp);
						const expirationDate = new Date(
							recordingDate.getTime() + retentionMinutes * 60 * 1000,
						);
						return new Date() > expirationDate;
					});
					if (expiredRecordings.length === 0) return Ok(undefined);
					const deleteExpiredRecordingsResult =
						await this.deleteRecordings(expiredRecordings);
					if (!deleteExpiredRecordingsResult.ok) {
						return DbServiceErr({
							title: 'Unable to clean up expired recordings',
							description: 'Some expired recordings could not be deleted',
							error: deleteExpiredRecordingsResult.error,
						});
					}
					return Ok(undefined);
				}
			}
		},
	};
}

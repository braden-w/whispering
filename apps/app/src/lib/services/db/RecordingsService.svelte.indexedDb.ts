import { Ok, tryAsync } from '@epicenterhq/result';
import type { Settings } from '@repo/shared';
import { type DBSchema, openDB } from 'idb';
import { toast } from '../../utils/toast';
import type { DbService } from './RecordingsService';
import { DbServiceErr, type Recording } from './RecordingsService';

const DB_NAME = 'RecordingDB' as const;
const DB_VERSION = 3 as const;

interface RecordingsDbSchemaV3 extends DBSchema {
	recordings: { key: Recording['id']; value: Recording };
}

interface RecordingsDbSchemaV2 extends DBSchema {
	recordingMetadata: {
		key: Recording['id'];
		value: Omit<Recording, 'blob'>;
	};
	recordingBlobs: {
		key: Recording['id'];
		value: { id: Recording['id']; blob: Blob | undefined };
	};
}

interface RecordingsDbSchemaV1 extends DBSchema {
	recordings: { key: Recording['id']; value: Recording };
}

type RecordingsDbSchema = RecordingsDbSchemaV3 &
	RecordingsDbSchemaV2 &
	RecordingsDbSchemaV1;

export function createRecordingsIndexedDbService(): DbService {
	let recordings = $state<Recording[]>([]);

	const dbPromise = openDB<RecordingsDbSchema>(DB_NAME, DB_VERSION, {
		async upgrade(db, oldVersion, newVersion, transaction) {
			if (newVersion !== DB_VERSION)
				throw new Error('newVersion should be equal to DB_VERSION');

			if (oldVersion === 0) {
				// Fresh install - go straight to v3 schema
				transaction.db.createObjectStore('recordings', {
					keyPath: 'id',
				});
				return;
			}

			if (oldVersion === 1) {
				// Upgrade from v1 to v3 (no changes needed)
				return;
			}

			if (oldVersion === 2) {
				// Upgrade from v2 to v3 (combine stores back to single store)
				const metadataStore = transaction.objectStore('recordingMetadata');
				const metadata = await metadataStore.getAll();

				const blobStore = transaction.objectStore('recordingBlobs');
				const blobs = await blobStore.getAll();

				const newRecordingsStore = transaction.db.createObjectStore(
					'recordings',
					{ keyPath: 'id' },
				);

				// Combine and migrate the data
				for (const record of metadata) {
					const blobData = blobs.find((b) => b.id === record.id);
					await newRecordingsStore.add({
						...record,
						blob: blobData?.blob,
					});
				}

				// Delete old stores
				transaction.db.deleteObjectStore('recordingMetadata');
				transaction.db.deleteObjectStore('recordingBlobs');
			}
		},
	});

	const syncDbToRecordingsState = async () => {
		const allRecordingsFromDbResult = await tryAsync({
			try: async () => {
				const tx = (await dbPromise).transaction(
					'recordings' as const,
					'readonly',
				);
				const store = tx.objectStore('recordings');
				const records = await store.getAll();
				await tx.done;
				return records;
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
					const tx = (await dbPromise).transaction('recordings', 'readonly');
					const store = tx.objectStore('recordings');
					const recording = await store.get(id);
					await tx.done;
					return recording || null;
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
					const tx = (await dbPromise).transaction('recordings', 'readwrite');
					const store = tx.objectStore('recordings');
					await store.add(recording);
					await tx.done;
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
					const tx = (await dbPromise).transaction('recordings', 'readwrite');
					const store = tx.objectStore('recordings');
					await store.put(recording);
					await tx.done;
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
					const tx = (await dbPromise).transaction('recordings', 'readwrite');
					const store = tx.objectStore('recordings');
					await store.delete(recording.id);
					await tx.done;
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
					const tx = (await dbPromise).transaction('recordings', 'readwrite');
					const store = tx.objectStore('recordings');
					await Promise.all(
						recordingsToDelete.map((recording) => store.delete(recording.id)),
					);
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
			'database.recordingRetentionStrategy': recordingRetentionStrategy,
			'database.maxRecordingCount': maxRecordingCount,
		}) {
			switch (recordingRetentionStrategy) {
				case 'keep-forever': {
					return Ok(undefined);
				}
				case 'limit-count': {
					if (recordings.length === 0) return Ok(undefined);

					const maxCount = Number.parseInt(maxRecordingCount);
					if (recordings.length <= maxCount) return Ok(undefined);

					// Sort recordings by timestamp (oldest first)
					const sortedRecordings = [...recordings].sort(
						(a, b) =>
							new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
					);

					// Get recordings to delete (all recordings beyond the max count, starting from oldest)
					const recordingsToDelete = sortedRecordings.slice(
						0,
						sortedRecordings.length - maxCount,
					);

					if (recordingsToDelete.length === 0) return Ok(undefined);

					const deleteRecordingsResult =
						await this.deleteRecordings(recordingsToDelete);
					if (!deleteRecordingsResult.ok) {
						return DbServiceErr({
							title: 'Unable to clean up old recordings',
							description: 'Some old recordings could not be deleted',
							error: deleteRecordingsResult.error,
						});
					}
					return Ok(undefined);
				}
			}
		},
	};
}

import { moreDetailsDialog } from '$lib/components/MoreDetailsDialog.svelte';
import { DownloadService } from '$lib/services.svelte';
import { Ok, tryAsync } from '@epicenterhq/result';
import type { Settings } from '@repo/shared';
import Dexie, { type Transaction } from 'dexie';
import { toast } from '../../utils/toast';
import type { DbService } from './DbService';
import { DbServiceErr } from './DbService';

const DB_NAME = 'RecordingDB';
const DB_VERSION = 4;

export type Recording = RecordingsDbSchemaV4['recordings'];

export type RecordingsDbSchemaV4 = {
	recordings: Omit<RecordingsDbSchemaV3['recordings'], 'timestamp'> & {
		createdAt: string;
		updatedAt: string;
	};
	transformations: {
		id: string;
		title: string;
		description: string;
		createdAt: string;
		updatedAt: string;
		/**
		 * A transformationStep is a single step in a transformation.
		 * It can be one of several types of text transformations:
		 * - find_replace: Replace text patterns with new text
		 * - prompt_transform: Use AI to transform text based on prompts
		 */
		transformationSteps: {
			id: string;
			title: string;
			description: string;
			createdAt: string;
			updatedAt: string;

			type: 'find_replace' | 'prompt_transform';

			'find_replace.findText': string;
			'find_replace.replaceText': string;
			'find_replace.useRegex': boolean;

			'prompt_transform.model': string;
			'prompt_transform.systemPromptTemplate': string;
			'prompt_transform.userPromptTemplate': string;
		};
	};

	/**
	 * Can be invoked on a recording or on arbitrary text.
	 */
	transformationRuns: {
		id: string;
		/**
		 * Recording id if the transformation is invoked on a recording.
		 *
		 * Null if the transformation is invoked on arbitrary text input.
		 */
		recordingId: string | null;
		status: 'running' | 'completed' | 'failed';
		startedAt: string;
		completedAt: string | null;
		/**
		 * Because the recording's transcribedText can change after invoking,
		 * we store a snapshot of the transcribedText at the time of invoking.
		 */
		input: string;

		error: string | null;
		output: string | null;

		transformationStepRuns: {
			id: string;
			status: 'running' | 'completed' | 'failed';
			startedAt: string;
			completedAt: string | null;

			input: string;

			error: string | null;
			output: string | null;
		};
	};
};

type RecordingsDbSchemaV3 = {
	recordings: RecordingsDbSchemaV1['recordings'];
};

type RecordingsDbSchemaV2 = {
	recordingMetadata: Omit<RecordingsDbSchemaV1['recordings'], 'blob'>;
	recordingBlobs: { id: string; blob: Blob | undefined };
};

type RecordingsDbSchemaV1 = {
	recordings: {
		id: string;
		title: string;
		subtitle: string;
		timestamp: string;
		transcribedText: string;
		blob: Blob | undefined;
		/**
		 * A recording
		 * 1. Begins in an 'UNPROCESSED' state
		 * 2. Moves to 'TRANSCRIBING' while the audio is being transcribed
		 * 3. Finally is marked as 'DONE' when the transcription is complete.
		 */
		transcriptionStatus: 'UNPROCESSED' | 'TRANSCRIBING' | 'DONE';
	};
};

class RecordingsDatabase extends Dexie {
	recordings!: Dexie.Table<RecordingsDbSchemaV4['recordings'], string>;
	transformations!: Dexie.Table<
		RecordingsDbSchemaV4['transformations'],
		string
	>;
	transformationRuns!: Dexie.Table<
		RecordingsDbSchemaV4['transformationRuns'],
		string
	>;

	constructor() {
		super(DB_NAME);

		const handleUpgradeError = async ({
			tx,
			version,
			error,
		}: { tx: Transaction; version: number; error: unknown }) => {
			const DUMP_TABLE_NAMES = [
				'recordings',
				'recordingMetadata',
				'recordingBlobs',
			] as const;

			const dumpTable = async (tableName: string) => {
				try {
					const contents = await tx.table(tableName).toArray();
					return contents;
				} catch (error) {
					return [];
				}
			};

			const dumps = await Promise.all(
				DUMP_TABLE_NAMES.map((name) => dumpTable(name)),
			);

			const dumpState = {
				version,
				tables: Object.fromEntries(
					DUMP_TABLE_NAMES.map((name, i) => [name, dumps[i]]),
				),
			};

			const dumpString = JSON.stringify(dumpState, null, 2);

			moreDetailsDialog.open({
				title: `Failed to upgrade IndexedDb Database to version ${version}`,
				description:
					'Please download the database dump and delete the database to start fresh.',
				content: dumpString,
				buttons: [
					{
						label: 'Delete Database',
						onClick: async () => {
							try {
								// Delete all tables
								await Promise.all(
									DUMP_TABLE_NAMES.map((name) => tx.table(name).clear()),
								);
								// Delete the database
								await this.delete();
								// Reset the version
								await Dexie.delete(DB_NAME);
								toast.success({
									title: 'Database Deleted',
									description:
										'The database has been successfully deleted. Please refresh the page.',
								});
								// Force reload to reinitialize the database
								window.location.reload();
							} catch (err) {
								const error =
									err instanceof Error ? err : new Error(String(err));
								toast.error({
									title: 'Failed to Delete Database',
									description:
										'There was an error deleting the database. Please try again.',
									action: {
										type: 'more-details',
										error,
									},
								});
							}
						},
					},
					{
						label: 'Download Database Dump',
						onClick: () => {
							const blob = new Blob([dumpString], {
								type: 'application/json',
							});
							DownloadService.downloadBlob({
								name: 'recording-db-dump.json',
								blob,
							});
						},
					},
				],
			});

			throw error; // Re-throw to trigger rollback
		};

		// V1: Single recordings table
		this.version(1).stores({ recordings: '&id, timestamp' });

		// V2: Split into metadata and blobs
		this.version(2)
			.stores({
				recordings: null,
				recordingMetadata: '&id, timestamp',
				recordingBlobs: '&id',
			})
			.upgrade(async (tx) => {
				try {
					// Migrate data from recordings to split tables
					const oldRecordings = await tx
						.table<RecordingsDbSchemaV1['recordings']>('recordings')
						.toArray();

					// Create entries in both new tables
					const metadata = oldRecordings.map(
						({ blob, ...recording }) => recording,
					);
					const blobs = oldRecordings.map(({ id, blob }) => ({ id, blob }));

					await tx
						.table<RecordingsDbSchemaV2['recordingMetadata']>(
							'recordingMetadata',
						)
						.bulkAdd(metadata);
					await tx
						.table<RecordingsDbSchemaV2['recordingBlobs']>('recordingBlobs')
						.bulkAdd(blobs);
				} catch (error) {
					await handleUpgradeError({ tx, version: 2, error });
				}
			});

		// V3: Back to single recordings table
		this.version(3)
			.stores({
				recordings: '&id, timestamp',
				recordingMetadata: null,
				recordingBlobs: null,
			})
			.upgrade(async (tx) => {
				try {
					// Get data from both tables
					const metadata = await tx
						.table<RecordingsDbSchemaV2['recordingMetadata']>(
							'recordingMetadata',
						)
						.toArray();
					const blobs = await tx
						.table<RecordingsDbSchemaV2['recordingBlobs']>('recordingBlobs')
						.toArray();

					// Combine and migrate the data
					const mergedRecordings = metadata.map((record) => {
						const blob = blobs.find((b) => b.id === record.id)?.blob;
						return { ...record, blob };
					});

					await tx
						.table<RecordingsDbSchemaV3['recordings']>('recordings')
						.bulkAdd(mergedRecordings);
				} catch (error) {
					await handleUpgradeError({ tx, version: 3, error });
				}
			});

		// V4: Add transformations, pipelines, and pipeline runs tables
		// Also migrate recordings timestamp to createdAt and updatedAt
		this.version(4)
			.stores({
				recordings: '&id, createdAt, updatedAt',
				// transformations: '&id, createdAt, updatedAt',
				// pipelines: '&id, createdAt, updatedAt',
				// pipelineRuns: '&id, pipelineId, recordingId, startedAt',
				// transformationResults:
				// 	'&id, pipelineRunId, transformationId, startedAt',
			})
			.upgrade(async (tx) => {
				try {
					const oldRecordings = await tx
						.table<RecordingsDbSchemaV3['recordings']>('recordings')
						.toArray();

					const newRecordings = oldRecordings.map(
						({ timestamp, ...record }) => ({
							...record,
							createdAt: timestamp,
							updatedAt: timestamp,
						}),
					);

					await tx.table('recordings').clear();
					await tx.table('recordings').bulkAdd(newRecordings);
				} catch (error) {
					await handleUpgradeError({ tx, version: 4, error });
				}
			});
	}
}

export function createDbDexieService(): DbService {
	const db = new RecordingsDatabase();

	return {
		async getAllRecordings() {
			return tryAsync({
				try: () => db.recordings.toArray(),
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error getting all recordings from Dexie',
						description: 'Please try again',
						error,
					}),
			});
		},

		async createRecording(recording: Recording) {
			const createRecordingResult = await tryAsync({
				try: async () => {
					await db.recordings.add(recording);
				},
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error adding recording to Dexie',
						description: 'Please try again',
						error,
					}),
			});
			if (!createRecordingResult.ok) return createRecordingResult;
			return Ok(undefined);
		},

		async updateRecording(recording: Recording) {
			const updateRecordingResult = await tryAsync({
				try: async () => {
					await db.recordings.put(recording);
				},
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error updating recording in Dexie',
						description: 'Please try again',
						error,
					}),
			});
			if (!updateRecordingResult.ok) return updateRecordingResult;
			return Ok(undefined);
		},

		async deleteRecording(recording: Recording) {
			const deleteRecordingByIdResult = await tryAsync({
				try: async () => {
					await db.recordings.delete(recording.id);
				},
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error deleting recording from Dexie',
						description: 'Please try again',
						error,
					}),
			});
			if (!deleteRecordingByIdResult.ok) return deleteRecordingByIdResult;
			return Ok(undefined);
		},

		async deleteRecordings(recordingsToDelete: Recording[]) {
			const ids = recordingsToDelete.map((r) => r.id);
			return tryAsync({
				try: () => db.recordings.bulkDelete(ids),
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error deleting recordings from Dexie',
						description: 'Please try again',
						error,
					}),
			});
		},

		async cleanupExpiredRecordings({
			'database.recordingRetentionStrategy': recordingRetentionStrategy,
			'database.maxRecordingCount': maxRecordingCount,
		}: Settings) {
			switch (recordingRetentionStrategy) {
				case 'keep-forever': {
					return Ok(undefined);
				}
				case 'limit-count': {
					const countResult = await tryAsync({
						try: () => db.recordings.count(),
						mapErr: (error) =>
							DbServiceErr({
								title:
									'Unable to get recording count while cleaning up old recordings',
								description: 'Please try again',
								error,
							}),
					});
					if (!countResult.ok) return countResult;
					const count = countResult.data;
					if (count === 0) return Ok(undefined);

					const maxCount = Number.parseInt(maxRecordingCount);

					if (count <= maxCount) return Ok(undefined);

					return tryAsync({
						try: async () => {
							const idsToDelete = await db.recordings
								.orderBy('createdAt')
								.limit(count - maxCount)
								.primaryKeys();
							await db.recordings.bulkDelete(idsToDelete);
						},
						mapErr: (error) =>
							DbServiceErr({
								title: 'Unable to clean up old recordings',
								description: 'Some old recordings could not be deleted',
								error,
							}),
					});
				}
			}
		},

		async getAllTransformations() {
			return tryAsync({
				try: () => db.transformations.toArray(),
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error getting all transformations from Dexie',
						description: 'Please try again',
						error,
					}),
			});
		},

		async createTransformation(transformation) {
			const createTransformationResult = await tryAsync({
				try: () => db.transformations.add(transformation),
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error adding transformation to Dexie',
						description: 'Please try again',
						error,
					}),
			});
			if (!createTransformationResult.ok) return createTransformationResult;
			return Ok(undefined);
		},

		async updateTransformation(transformation) {
			const updateTransformationResult = await tryAsync({
				try: () => db.transformations.put(transformation),
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error updating transformation in Dexie',
						description: 'Please try again',
						error,
					}),
			});
			if (!updateTransformationResult.ok) return updateTransformationResult;
			return Ok(undefined);
		},

		async deleteTransformation(transformation) {
			const deleteTransformationResult = await tryAsync({
				try: () => db.transformations.delete(transformation.id),
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error deleting transformation from Dexie',
						description: 'Please try again',
						error,
					}),
			});
			if (!deleteTransformationResult.ok) return deleteTransformationResult;
			return Ok(undefined);
		},
	};
}

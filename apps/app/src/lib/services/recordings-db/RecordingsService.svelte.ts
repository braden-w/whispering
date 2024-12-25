import { renderErrAsToast } from '$lib/services/renderErrorAsToast';
import { Ok } from '@epicenterhq/result';
import type { DbService, DbServiceResult, Recording } from './db/DbService';
import { createIndexedDbService } from './db/DbServiceIndexedDbLive.svelte';

type RecordingServiceResult<T> = DbServiceResult<T>;

export type RecordingsService = {
	get recordings(): Recording[];
	addRecording: (recording: Recording) => Promise<RecordingServiceResult<void>>;
	updateRecording: (
		recording: Recording,
	) => Promise<RecordingServiceResult<void>>;
	deleteRecordingById: (id: string) => Promise<RecordingServiceResult<string>>;
	deleteRecordingsById: (
		ids: string[],
	) => Promise<RecordingServiceResult<string[]>>;
};

export const RecordingsService = createRecordingsService({
	DbService: createIndexedDbService(),
});

function createRecordingsService({
	DbService,
}: { DbService: DbService }): RecordingsService {
	let recordingsArray = $state<Recording[]>([]);

	const syncDbToRecordingsState = async () => {
		const getAllRecordingsResult = await DbService.getAllRecordings();
		if (!getAllRecordingsResult.ok) {
			return renderErrAsToast({
				variant: 'error',
				title: 'Failed to initialize recordings',
				description:
					'Unable to load your recordings from the database. This could be due to browser storage issues or corrupted data.',
				action: { type: 'more-details', error: getAllRecordingsResult.error },
			});
		}
		recordingsArray = getAllRecordingsResult.data;
	};

	syncDbToRecordingsState();

	return {
		get recordings() {
			return recordingsArray;
		},

		async addRecording(recording: Recording) {
			const addRecordingResult = await DbService.addRecording(recording);
			if (!addRecordingResult.ok) return addRecordingResult;

			recordingsArray = [...recordingsArray, recording];
			return Ok(undefined);
		},

		async updateRecording(recording) {
			const updateRecordingResult = await DbService.updateRecording(recording);
			if (!updateRecordingResult.ok) return updateRecordingResult;

			recordingsArray = recordingsArray.map((r) =>
				r.id === recording.id ? recording : r,
			);
			return Ok(undefined);
		},

		async deleteRecordingById(id: string) {
			const deleteRecordingByIdResult = await DbService.deleteRecordingById(id);
			if (!deleteRecordingByIdResult.ok) return deleteRecordingByIdResult;

			recordingsArray = recordingsArray.filter((r) => r.id !== id);
			return Ok(id);
		},

		async deleteRecordingsById(ids: string[]) {
			const deleteRecordingsByIdResult =
				await DbService.deleteRecordingsById(ids);
			if (!deleteRecordingsByIdResult.ok) return deleteRecordingsByIdResult;

			recordingsArray = recordingsArray.filter(
				(recording) => !ids.includes(recording.id),
			);
			return Ok(ids);
		},
	};
}

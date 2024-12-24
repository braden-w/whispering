import type {
	Recording,
	Recordings,
	RecordingsErrorProperties,
} from './db/DbService';
import { renderErrAsToast } from '$lib/services/renderErrorAsToast';
import { Ok, type ServiceFn } from '@repo/shared/epicenter-result';
import { createRecordingsLiveIndexedDb } from './db/DbServiceIndexedDbLive.svelte';

export type RecordingsService = {
	get recordings(): Recording[];
	updateRecording: ServiceFn<Recording, void, RecordingsErrorProperties>;
	deleteRecordingById: ServiceFn<string, string, RecordingsErrorProperties>;
	deleteRecordingsById: ServiceFn<
		string[],
		string[],
		RecordingsErrorProperties
	>;
};

export const RecordingsService = createRecordingsService({
	Recordings: createRecordingsLiveIndexedDb(),
});

function createRecordingsService({
	Recordings,
}: { Recordings: Recordings }): RecordingsService {
	let recordingsArray = $state<Recording[]>([]);

	const syncDbToRecordingsState = async () => {
		const getAllRecordingsResult = await Recordings.getAllRecordings();
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
		async updateRecording(recording) {
			const updateRecordingResult = await Recordings.updateRecording(recording);
			if (!updateRecordingResult.ok) {
				return updateRecordingResult;
			}
			recordingsArray = recordingsArray.map((r) =>
				r.id === recording.id ? recording : r,
			);
			return Ok(undefined);
		},
		async deleteRecordingById(id: string) {
			const deleteRecordingByIdResult =
				await Recordings.deleteRecordingById(id);
			if (!deleteRecordingByIdResult.ok) {
				return deleteRecordingByIdResult;
			}
			recordingsArray = recordingsArray.filter((r) => r.id !== id);
			return Ok(id);
		},
		async deleteRecordingsById(ids: string[]) {
			const deleteRecordingsByIdResult =
				await Recordings.deleteRecordingsById(ids);
			if (!deleteRecordingsByIdResult.ok) {
				return deleteRecordingsByIdResult;
			}
			recordingsArray = recordingsArray.filter(
				(recording) => !ids.includes(recording.id),
			);
			return Ok(ids);
		},
	};
}

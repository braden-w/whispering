import type { Ok } from '@epicenterhq/result';
import { Err } from '@epicenterhq/result';
import { DownloadService } from '../DownloadService';
import { toast } from '../ToastService';
import { createRecordingsIndexedDbService } from './RecordingsIndexedDbService.svelte';

export const RecordingsService = createRecordingsIndexedDbService();

export const recordings = createRecordings();

function createRecordings() {
	return {
		get value() {
			return RecordingsService.recordings;
		},

		updateRecordingWithToast: async (recording: Recording) => {
			const result = await RecordingsService.updateRecording(recording);
			if (!result.ok) {
				toast.error({
					title: 'Failed to update recording!',
					description: 'Your recording could not be updated.',
				});
				return;
			}
			toast.success({
				title: 'Updated recording!',
				description: 'Your recording has been updated successfully.',
			});
			return;
		},

		deleteRecordingByIdWithToast: async (id: string) => {
			const result = await RecordingsService.deleteRecordingById(id);
			if (!result.ok) {
				toast.error({
					title: 'Failed to delete recording!',
					description: 'Your recording could not be deleted.',
				});
				return;
			}
			toast.success({
				title: 'Deleted recording!',
				description: 'Your recording has been deleted successfully.',
			});
			return;
		},

		deleteRecordingsByIdWithToast: async (ids: string[]) => {
			const result = await RecordingsService.deleteRecordingsById(ids);
			if (!result.ok) {
				toast.error({
					title: 'Failed to delete recordings!',
					description: 'Your recordings could not be deleted.',
				});
				return;
			}
			toast.success({
				title: 'Deleted recordings!',
				description: 'Your recordings have been deleted successfully.',
			});
			return;
		},

		downloadRecordingWithToast: async (recording: Recording) => {
			const result = await DownloadService.downloadBlob({
				name: `whispering_recording_${recording.id}`,
				blob: recording.blob,
			});
			if (!result.ok) {
				toast.error({
					title: 'Failed to download recording!',
					description: 'Your recording could not be downloaded.',
					action: { type: 'more-details', error: result.error },
				});
				return;
			}
			toast.success({
				title: 'Recording downloading!',
				description: 'Your recording is being downloaded.',
			});
			return;
		},
	};
}

type TranscriptionStatus = 'UNPROCESSED' | 'TRANSCRIBING' | 'DONE';

export type Recording = {
	id: string;
	title: string;
	subtitle: string;
	timestamp: string;
	transcribedText: string;
	blob: Blob;
	/**
	 * A recording
	 * 1. Begins in an 'UNPROCESSED' state
	 * 2. Moves to 'TRANSCRIBING' while the audio is being transcribed
	 * 3. Finally is marked as 'DONE' when the transcription is complete.
	 */
	transcriptionStatus: TranscriptionStatus;
};

type DbErrorProperties = {
	_tag: 'DbServiceError';
	title: string;
	description: string;
	error: unknown;
};

export type DbServiceErr = Err<DbErrorProperties>;
export type DbServiceResult<T> = Ok<T> | DbServiceErr;

export const DbServiceErr = (
	properties: Omit<DbErrorProperties, '_tag'>,
): DbServiceErr => {
	return Err({
		_tag: 'DbServiceError',
		...properties,
	});
};

export type DbService = {
	get recordings(): Recording[];
	getRecording: (id: string) => Promise<DbServiceResult<Recording | null>>;
	addRecording: (recording: Recording) => Promise<DbServiceResult<void>>;
	updateRecording: (recording: Recording) => Promise<DbServiceResult<void>>;
	deleteRecordingById: (id: string) => Promise<DbServiceResult<void>>;
	deleteRecordingsById: (ids: string[]) => Promise<DbServiceResult<void>>;
};

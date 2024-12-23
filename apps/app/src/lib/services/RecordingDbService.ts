import type { QueryFn } from '@epicenterhq/result';
import type { WhisperingErrProperties } from '@repo/shared';
import { createRecordingsDbServiceLiveIndexedDb } from './RecordingDbServiceIndexedDbLive.svelte';

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

export type RecordingsDbService = {
	readonly getAllRecordings: QueryFn<
		void,
		Recording[],
		WhisperingErrProperties
	>;
	readonly getRecording: QueryFn<
		string,
		Recording | null,
		WhisperingErrProperties
	>;
	readonly addRecording: QueryFn<Recording, void, WhisperingErrProperties>;
	readonly updateRecording: QueryFn<
		Recording,
		void,
		WhisperingErrProperties
	>;
	readonly deleteRecordingById: QueryFn<
		string,
		void,
		WhisperingErrProperties
	>;
	readonly deleteRecordingsById: QueryFn<
		string[],
		void,
		WhisperingErrProperties
	>;
};

export const RecordingsDbService = createRecordingsDbServiceLiveIndexedDb();

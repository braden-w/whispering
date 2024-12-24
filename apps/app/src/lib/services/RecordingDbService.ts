import type { ServiceFn } from '@epicenterhq/result';
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
	readonly getAllRecordings: ServiceFn<
		void,
		Recording[],
		WhisperingErrProperties
	>;
	readonly getRecording: ServiceFn<
		string,
		Recording | null,
		WhisperingErrProperties
	>;
	readonly addRecording: ServiceFn<Recording, void, WhisperingErrProperties>;
	readonly updateRecording: ServiceFn<Recording, void, WhisperingErrProperties>;
	readonly deleteRecordingById: ServiceFn<
		string,
		void,
		WhisperingErrProperties
	>;
	readonly deleteRecordingsById: ServiceFn<
		string[],
		void,
		WhisperingErrProperties
	>;
};

export const RecordingsDbService = createRecordingsDbServiceLiveIndexedDb();

import type { WhisperingResult } from '@repo/shared';
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
	readonly getAllRecordings: () => Promise<WhisperingResult<Recording[]>>;
	readonly getRecording: (
		id: string,
	) => Promise<WhisperingResult<Recording | null>>;
	readonly addRecording: (
		recording: Recording,
	) => Promise<WhisperingResult<void>>;
	readonly updateRecording: (
		recording: Recording,
	) => Promise<WhisperingResult<void>>;
	readonly deleteRecordingById: (id: string) => Promise<WhisperingResult<void>>;
	readonly deleteRecordingsById: (
		ids: string[],
	) => Promise<WhisperingResult<void>>;
};

export const RecordingsDbService = createRecordingsDbServiceLiveIndexedDb();

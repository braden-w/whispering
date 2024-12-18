import type { Result } from '@repo/shared';
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
	readonly getAllRecordings: () => Promise<Result<Recording[]>>;
	readonly getRecording: (id: string) => Promise<Result<Recording | null>>;
	readonly addRecording: (recording: Recording) => Promise<Result<void>>;
	readonly updateRecording: (recording: Recording) => Promise<Result<void>>;
	readonly deleteRecordingById: (id: string) => Promise<Result<void>>;
	readonly deleteRecordingsById: (ids: string[]) => Promise<Result<void>>;
};

export const RecordingsDbService = createRecordingsDbServiceLiveIndexedDb();

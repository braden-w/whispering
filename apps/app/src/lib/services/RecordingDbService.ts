import type { WhisperingError } from '@repo/shared';
import type { Effect, Option } from 'effect';
import { Context } from 'effect';

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

export class RecordingsDbService extends Context.Tag('RecordingsDbService')<
	RecordingsDbService,
	{
		readonly getAllRecordings: Effect.Effect<Recording[], WhisperingError>;
		readonly getRecording: (
			id: string,
		) => Effect.Effect<Option.Option<Recording>, WhisperingError>;
		readonly addRecording: (
			recording: Recording,
		) => Effect.Effect<void, WhisperingError>;
		readonly updateRecording: (
			recording: Recording,
		) => Effect.Effect<void, WhisperingError>;
		readonly deleteRecordingById: (
			id: string,
		) => Effect.Effect<void, WhisperingError>;
		readonly deleteRecordingsById: (
			ids: string[],
		) => Effect.Effect<void, WhisperingError>;
	}
>() {}

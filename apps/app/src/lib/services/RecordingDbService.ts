import type { Effect, Option } from 'effect';
import { Context, Data } from 'effect';
import type { WhisperingErrorProperties } from '@repo/shared';

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

export class RecordingDbError extends Data.TaggedError(
	'RecordingDbError',
)<WhisperingErrorProperties> {}

export class RecordingsDbService extends Context.Tag('RecordingsDbService')<
	RecordingsDbService,
	{
		readonly getAllRecordings: Effect.Effect<Recording[], RecordingDbError>;
		readonly getRecording: (
			id: string,
		) => Effect.Effect<Option.Option<Recording>, RecordingDbError>;
		readonly addRecording: (recording: Recording) => Effect.Effect<void, RecordingDbError>;
		readonly updateRecording: (recording: Recording) => Effect.Effect<void, RecordingDbError>;
		readonly deleteRecordingById: (id: string) => Effect.Effect<void, RecordingDbError>;
		readonly deleteRecordingsById: (ids: string[]) => Effect.Effect<void, RecordingDbError>;
	}
>() {}

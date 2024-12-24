import type { Result } from '@epicenterhq/result';
import { Err } from '@repo/shared/epicenter-result';

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
	_tag: 'DbError';
	title: string;
	description: string;
	error: unknown;
};

export type DbServiceResult<T> = Result<T, DbErrorProperties>;

export const DbError = (
	properties: Omit<DbErrorProperties, '_tag'>,
): DbServiceResult<never> => {
	return Err({
		_tag: 'DbError',
		...properties,
	});
};

export type Recordings = {
	readonly getAllRecordings: () => DbServiceResult<Recording[]>;
	readonly getRecording: (id: string) => DbServiceResult<Recording | null>;
	readonly addRecording: (recording: Recording) => DbServiceResult<void>;
	readonly updateRecording: (recording: Recording) => DbServiceResult<void>;
	readonly deleteRecordingById: (id: string) => DbServiceResult<void>;
	readonly deleteRecordingsById: (ids: string[]) => DbServiceResult<void>;
};

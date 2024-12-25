import type { Result } from '@epicenterhq/result';
import { Err } from '@epicenterhq/result';

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
export type DbServiceErr = DbServiceResult<never>;

export const DbError = (
	properties: Omit<DbErrorProperties, '_tag'>,
): DbServiceErr => {
	return Err({
		_tag: 'DbError',
		...properties,
	});
};

export type DbService = {
	readonly getAllRecordings: () => Promise<DbServiceResult<Recording[]>>;
	readonly getRecording: (
		id: string,
	) => Promise<DbServiceResult<Recording | null>>;
	readonly addRecording: (
		recording: Recording,
	) => Promise<DbServiceResult<void>>;
	readonly updateRecording: (
		recording: Recording,
	) => Promise<DbServiceResult<void>>;
	readonly deleteRecordingById: (id: string) => Promise<DbServiceResult<void>>;
	readonly deleteRecordingsById: (
		ids: string[],
	) => Promise<DbServiceResult<void>>;
};

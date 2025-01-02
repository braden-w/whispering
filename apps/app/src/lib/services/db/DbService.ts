import { Err, type Ok } from '@epicenterhq/result';
import type { Settings } from '@repo/shared';
import type { RecordingsDbSchemaV4 } from './DbService.dexie';

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
	return Err({ _tag: 'DbServiceError', ...properties });
};

export type Recording = RecordingsDbSchemaV4['recordings'];
export type Transformation = RecordingsDbSchemaV4['transformations'];
export type TransformationResult = RecordingsDbSchemaV4['transformationRuns'];

export type DbService = {
	getAllRecordings: () => Promise<DbServiceResult<Recording[]>>;
	addRecording: (recording: Recording) => Promise<DbServiceResult<void>>;
	updateRecording: (recording: Recording) => Promise<DbServiceResult<void>>;
	deleteRecording: (recording: Recording) => Promise<DbServiceResult<void>>;
	deleteRecordings: (recordings: Recording[]) => Promise<DbServiceResult<void>>;
	/**
	 * Checks and deletes expired recordings based on current settings.
	 * This should be called:
	 * 1. On initial load
	 * 2. Before adding new recordings
	 * 3. When retention settings change
	 */
	cleanupExpiredRecordings: (
		settings: Settings,
	) => Promise<DbServiceResult<void>>;

	getAllTransformations: () => Promise<DbServiceResult<Transformation[]>>;
	addTransformation: (
		transformation: Transformation,
	) => Promise<DbServiceResult<void>>;
	updateTransformation: (
		transformation: Transformation,
	) => Promise<DbServiceResult<void>>;
	deleteTransformation: (
		transformation: Transformation,
	) => Promise<DbServiceResult<void>>;
};

import { Err, type Ok } from '@epicenterhq/result';
import type { Settings } from '@repo/shared';
import type { Recording } from './types/Recordings';
import type { Transformation } from './types/Transformations';
import type { TransformationResult } from './types/TransformationResults';

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
};

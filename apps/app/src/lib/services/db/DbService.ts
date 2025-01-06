import { Err, type Ok } from '@epicenterhq/result';
import type { Settings } from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import type {
	InsertRecording,
	InsertTransformation,
	Recording,
	Transformation,
	TransformationStep,
} from './DbService.dexie';

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

export function generateDefaultTransformation(): Transformation {
	const now = new Date().toISOString();
	return {
		id: nanoid(),
		title: '',
		description: '',
		steps: [],
		createdAt: now,
		updatedAt: now,
	};
}

export function generateDefaultTransformationStep(): TransformationStep {
	return {
		id: nanoid(),
		type: 'prompt_transform',
		'prompt_transform.inference.provider': 'Groq',
		'prompt_transform.inference.provider.OpenAI.model': 'gpt-4o',
		'prompt_transform.inference.provider.Groq.model': 'llama-3.3-70b-versatile',
		'prompt_transform.inference.provider.Anthropic.model':
			'claude-3-5-sonnet-latest',

		'prompt_transform.systemPromptTemplate': '',
		'prompt_transform.userPromptTemplate': '',

		'find_replace.findText': '',
		'find_replace.replaceText': '',
		'find_replace.useRegex': false,
	};
}

export type DbService = {
	getAllRecordings: () => Promise<DbServiceResult<Recording[]>>;
	createRecording: (
		recording: InsertRecording,
	) => Promise<DbServiceResult<Recording>>;
	updateRecording: (
		recording: Recording,
	) => Promise<DbServiceResult<Recording>>;
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
	createTransformation: (
		transformation: InsertTransformation,
	) => Promise<DbServiceResult<Transformation>>;
	updateTransformation: (
		transformation: Transformation,
	) => Promise<DbServiceResult<Transformation>>;
	deleteTransformation: (
		transformation: Transformation,
	) => Promise<DbServiceResult<void>>;
	deleteTransformations: (
		transformations: Transformation[],
	) => Promise<DbServiceResult<void>>;
};

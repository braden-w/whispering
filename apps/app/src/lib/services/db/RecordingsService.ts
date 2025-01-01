import { Err, type Ok } from '@epicenterhq/result';
import type { Settings } from '@repo/shared';
import type { RecordingsDbSchemaV4 } from './RecordingsService.svelte.dexie';

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

export type Pipeline = RecordingsDbSchemaV4['pipelines'];
export type Transformation = RecordingsDbSchemaV4['transformations'];
export type PipelineRun = RecordingsDbSchemaV4['pipelineRuns'];
export type TransformationResult =
	RecordingsDbSchemaV4['transformationResults'];
export type Recording = RecordingsDbSchemaV4['recordings'];

export type DbService = {
	// Recording methods
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

	getAllPipelines: () => Promise<DbServiceResult<Pipeline[]>>;
	addPipeline: (pipeline: Pipeline) => Promise<DbServiceResult<void>>;
	updatePipeline: (pipeline: Pipeline) => Promise<DbServiceResult<void>>;
	deletePipeline: (pipeline: Pipeline) => Promise<DbServiceResult<void>>;
	deletePipelineWithAssociatedTransformations: (
		pipeline: Pipeline,
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

	// Pipeline execution methods
	startPipelineRun: (
		pipeline: Pipeline,
		recording: Recording,
	) => Promise<DbServiceResult<string>>;
	updatePipelineRun: (
		pipelineRun: PipelineRun,
	) => Promise<DbServiceResult<string>>;
	getPipelineRunsByRecording: (
		recording: Recording,
	) => Promise<DbServiceResult<PipelineRun[]>>;
	getPipelineRun: (id: string) => Promise<DbServiceResult<PipelineRun | null>>;

	// Transformation results methods
	addTransformationResult: (
		result: TransformationResult,
	) => Promise<DbServiceResult<string>>;
	getTransformationResultsByPipelineRun: (
		pipelineRun: PipelineRun,
	) => Promise<DbServiceResult<TransformationResult[]>>;
};

import type { Recording } from './Recordings';
import type { Transformation } from './Transformations';

export type TransformationResult = {
	id: string;
	transformationId: Transformation['id'];
	recordingId: Recording['id'];
	inputText: string;
	outputText: string;
	timestamp: string;
	error?: string;
};

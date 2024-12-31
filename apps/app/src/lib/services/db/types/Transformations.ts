export type Transformation = FindReplaceTransformation | ModelTransformation;

type FindReplaceTransformation = {
	type: 'FIND_REPLACE';
	id: string;
	enabled: boolean;
	findText: string;
	replaceText: string;
};

type ModelTransformation = {
	type: 'MODEL';
	id: string;
	enabled: boolean;
	systemPrompt: string;
	userPrompt: string;
	model: string;
};

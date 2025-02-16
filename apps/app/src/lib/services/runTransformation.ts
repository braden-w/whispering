import { settings } from '$lib/stores/settings.svelte';
import { GoogleGenerativeAI, Outcome } from '@google/generative-ai';
import { Err, Ok, tryAsync } from '@epicenterhq/result';
import { WhisperingErr, type WhisperingResult } from '@repo/shared';
import { z } from 'zod';
import { DbRecordingsService } from '.';
import type {
	DbTransformationsService,
	TransformationRun,
	TransformationStep,
} from './db';
import type { HttpService } from './http/HttpService';

type TransformErrorProperties = {
	_tag: 'TransformError';
	code:
		| 'RECORDING_NOT_FOUND'
		| 'NO_INPUT'
		| 'TRANSFORMATION_NOT_FOUND'
		| 'NO_STEPS_CONFIGURED'
		| 'FAILED_TO_CREATE_TRANSFORMATION_RUN'
		| 'FAILED_TO_ADD_TRANSFORMATION_STEP_RUN'
		| 'FAILED_TO_MARK_TRANSFORMATION_RUN_AND_STEP_AS_FAILED'
		| 'FAILED_TO_MARK_TRANSFORMATION_RUN_STEP_AS_COMPLETED'
		| 'FAILED_TO_MARK_TRANSFORMATION_RUN_AS_COMPLETED';
};

export type TransformError = Err<TransformErrorProperties>;
export type TransformResult<T> = Ok<T> | TransformError;

export const TransformErrorToWhisperingErr = ({ error }: TransformError) => {
	switch (error.code) {
		case 'NO_INPUT':
			return WhisperingErr({
				title: '⚠️ Empty input',
				description: 'Please enter some text to transform',
			});
		case 'RECORDING_NOT_FOUND':
			return WhisperingErr({
				title: '⚠️ Recording not found',
				description: 'Could not find the selected recording.',
			});
		case 'TRANSFORMATION_NOT_FOUND':
			return WhisperingErr({
				title: '⚠️ Transformation not found',
				description: 'Could not find the selected transformation.',
			});
		case 'NO_STEPS_CONFIGURED':
			return WhisperingErr({
				title: 'No steps configured',
				description: 'Please add at least one transformation step',
			});
		case 'FAILED_TO_CREATE_TRANSFORMATION_RUN':
			return WhisperingErr({
				title: '⚠️ Failed to create transformation run',
				description: 'Could not create the transformation run.',
			});
		case 'FAILED_TO_ADD_TRANSFORMATION_STEP_RUN':
			return WhisperingErr({
				title: '⚠️ Failed to add transformation step run',
				description: 'Could not add the transformation step run.',
			});
		case 'FAILED_TO_MARK_TRANSFORMATION_RUN_AND_STEP_AS_FAILED':
			return WhisperingErr({
				title: '⚠️ Failed to mark transformation run and step as failed',
				description:
					'Could not mark the transformation run and step as failed.',
			});
		case 'FAILED_TO_MARK_TRANSFORMATION_RUN_STEP_AS_COMPLETED':
			return WhisperingErr({
				title: '⚠️ Failed to mark transformation run step as completed',
				description: 'Could not mark the transformation run step as completed.',
			});
		case 'FAILED_TO_MARK_TRANSFORMATION_RUN_AS_COMPLETED':
			return WhisperingErr({
				title: '⚠️ Failed to mark transformation run as completed',
				description: 'Could not mark the transformation run as completed.',
			});
	}
};

export const TransformError = <
	T extends Omit<TransformErrorProperties, '_tag'>,
>(
	properties: T,
) =>
	Err({
		_tag: 'TransformError',
		...properties,
	}) satisfies TransformError;

type StepResult = WhisperingResult<string>;

export function createRunTransformationService({
	DbTransformationsService,
	HttpService,
}: {
	DbTransformationsService: DbTransformationsService;
	HttpService: HttpService;
}) {
	const handleStep = async ({
		input,
		step,
		HttpService,
	}: {
		input: string;
		step: TransformationStep;
		HttpService: HttpService;
	}): Promise<StepResult> => {
		switch (step.type) {
			case 'find_replace': {
				const findText = step['find_replace.findText'];
				const replaceText = step['find_replace.replaceText'];
				const useRegex = step['find_replace.useRegex'];

				if (useRegex) {
					try {
						const regex = new RegExp(findText, 'g');
						return Ok(input.replace(regex, replaceText));
					} catch (error) {
						return WhisperingErr({
							title: 'Invalid regex pattern',
							description: 'The provided regex pattern is invalid',
							action: { type: 'more-details', error },
						});
					}
				}

				return Ok(input.replaceAll(findText, replaceText));
			}

			case 'prompt_transform': {
				const provider = step['prompt_transform.inference.provider'];
				const systemPrompt = step[
					'prompt_transform.systemPromptTemplate'
				].replace('{{input}}', input);
				const userPrompt = step['prompt_transform.userPromptTemplate'].replace(
					'{{input}}',
					input,
				);

				switch (provider) {
					case 'OpenAI': {
						const model =
							step['prompt_transform.inference.provider.OpenAI.model'];
						const result = await HttpService.post({
							url: 'https://api.openai.com/v1/chat/completions',
							headers: {
								'Content-Type': 'application/json',
								Authorization: `Bearer ${settings.value['apiKeys.openai']}`,
							},
							body: JSON.stringify({
								model,
								messages: [
									{ role: 'system', content: systemPrompt },
									{ role: 'user', content: userPrompt },
								],
							}),
							schema: z.object({
								choices: z.array(
									z.object({
										message: z.object({
											content: z.string(),
										}),
									}),
								),
							}),
						});

						if (!result.ok) {
							return WhisperingErr({
								title: 'OpenAI API Error',
								description: 'Error calling OpenAI API',
								action: { type: 'more-details', error: result.error },
							});
						}

						const responseText = result.data.choices[0]?.message?.content;
						if (!responseText) {
							return WhisperingErr({
								title: 'Empty response',
								description: 'OpenAI API returned an empty response',
							});
						}

						return Ok(responseText);
					}

					case 'Groq': {
						const model =
							step['prompt_transform.inference.provider.Groq.model'];
						const result = await HttpService.post({
							url: 'https://api.groq.com/openai/v1/chat/completions',
							headers: {
								'Content-Type': 'application/json',
								Authorization: `Bearer ${settings.value['apiKeys.groq']}`,
							},
							body: JSON.stringify({
								model,
								messages: [
									{ role: 'system', content: systemPrompt },
									{ role: 'user', content: userPrompt },
								],
							}),
							schema: z.object({
								choices: z.array(
									z.object({
										message: z.object({
											content: z.string(),
										}),
									}),
								),
							}),
						});

						if (!result.ok) {
							return WhisperingErr({
								title: 'Groq API Error',
								description: 'Error calling Groq API',
								action: { type: 'more-details', error: result.error },
							});
						}

						const responseText = result.data.choices[0]?.message?.content;
						if (!responseText) {
							return WhisperingErr({
								title: 'Empty response',
								description: 'Groq API returned an empty response',
							});
						}

						return Ok(responseText);
					}

					case 'Anthropic': {
						const model =
							step['prompt_transform.inference.provider.Anthropic.model'];
						const result = await HttpService.post({
							url: 'https://api.anthropic.com/v1/messages',
							headers: {
								'Content-Type': 'application/json',
								'anthropic-version': '2023-06-01',
								'x-api-key': settings.value['apiKeys.anthropic'],
								'anthropic-dangerous-direct-browser-access': 'true',
							},
							body: JSON.stringify({
								model,
								system: systemPrompt,
								messages: [{ role: 'user', content: userPrompt }],
								max_tokens: 1024,
							}),
							schema: z.object({
								content: z.array(
									z.object({
										type: z.literal('text'),
										text: z.string(),
									}),
								),
							}),
						});

						if (!result.ok) {
							return WhisperingErr({
								title: 'Anthropic API Error',
								description: 'Error calling Anthropic API',
								action: { type: 'more-details', error: result.error },
							});
						}

						const responseText = result.data.content[0]?.text;
						if (!responseText) {
							return WhisperingErr({
								title: 'Empty response',
								description: 'Anthropic API returned an empty response',
							});
						}

						return Ok(responseText);
					}

					case 'Google': {
						const combinedPrompt = `${systemPrompt}\n${userPrompt}`;

						const result = await tryAsync({
							try: async () => {
								const genAI = new GoogleGenerativeAI(
									settings.value['apiKeys.google'],
								);

								const model = genAI.getGenerativeModel({
									model:
										step['prompt_transform.inference.provider.Google.model'],
								});
								return await model.generateContent(combinedPrompt);
							},
							mapErr: (error) => {
								return WhisperingErr({
									title: 'Google API Error',
									description: 'Error calling Google API',
									action: { type: 'more-details', error },
								});
							},
						});
						if (!result.ok) return result;

						const responseText = result.data.response.text();

						if (!responseText) {
							return WhisperingErr({
								title: 'Empty response',
								description: 'Google API returned an empty response',
							});
						}

						return Ok(responseText);
					}

					default:
						return WhisperingErr({
							title: 'Invalid provider',
							description: `Unsupported provider: ${provider}`,
						});
				}
			}

			default:
				return WhisperingErr({
					title: 'Invalid step type',
					description: `Unsupported step type: ${step.type}`,
				});
		}
	};

	const runTransformation = async ({
		input,
		transformationId,
		recordingId,
	}: {
		input: string;
		transformationId: string;
		recordingId: string | null;
	}): Promise<TransformResult<TransformationRun>> => {
		const getTransformationResult =
			await DbTransformationsService.getTransformationById(transformationId);
		if (!getTransformationResult.ok || !getTransformationResult.data) {
			return TransformError({ code: 'TRANSFORMATION_NOT_FOUND' });
		}

		const transformation = getTransformationResult.data;

		if (transformation.steps.length === 0) {
			return TransformError({ code: 'NO_STEPS_CONFIGURED' });
		}

		const createTransformationRunResult =
			await DbTransformationsService.createTransformationRun({
				transformationId: transformation.id,
				recordingId,
				input,
			});

		if (!createTransformationRunResult.ok)
			return TransformError({
				code: 'FAILED_TO_CREATE_TRANSFORMATION_RUN',
			});

		const transformationRun = createTransformationRunResult.data;

		let currentInput = input;

		for (const step of transformation.steps) {
			const newTransformationStepRunResult =
				await DbTransformationsService.addTransformationStepRunToTransformationRun(
					{ transformationRun, stepId: step.id, input: currentInput },
				);

			if (!newTransformationStepRunResult.ok)
				return TransformError({
					code: 'FAILED_TO_ADD_TRANSFORMATION_STEP_RUN',
				});

			const newTransformationStepRun = newTransformationStepRunResult.data;

			const handleStepResult = await handleStep({
				input: currentInput,
				step,
				HttpService,
			});

			if (!handleStepResult.ok) {
				const dbResult =
					await DbTransformationsService.markTransformationRunAndRunStepAsFailed(
						{
							transformationRun,
							stepRunId: newTransformationStepRun.id,
							error: `${handleStepResult.error.title}: ${handleStepResult.error.description}`,
						},
					);
				if (!dbResult.ok)
					return TransformError({
						code: 'FAILED_TO_MARK_TRANSFORMATION_RUN_AND_STEP_AS_FAILED',
					});
				return dbResult;
			}

			const dbResult =
				await DbTransformationsService.markTransformationRunStepAsCompleted({
					transformationRun,
					stepRunId: newTransformationStepRun.id,
					output: handleStepResult.data,
				});

			if (!dbResult.ok)
				return TransformError({
					code: 'FAILED_TO_MARK_TRANSFORMATION_RUN_STEP_AS_COMPLETED',
				});

			currentInput = handleStepResult.data;
		}

		const dbResult =
			await DbTransformationsService.markTransformationRunAsCompleted({
				transformationRun,
				output: currentInput,
			});

		if (!dbResult.ok)
			return TransformError({
				code: 'FAILED_TO_MARK_TRANSFORMATION_RUN_AS_COMPLETED',
			});
		return dbResult;
	};

	return {
		transformInput: async ({
			input,
			transformationId,
		}: {
			input: string;
			transformationId: string;
		}): Promise<TransformResult<TransformationRun>> => {
			if (!input.trim()) {
				return TransformError({ code: 'NO_INPUT' });
			}
			return runTransformation({
				input,
				transformationId,
				recordingId: null,
			});
		},
		transformRecording: async ({
			transformationId,
			recordingId,
		}: {
			transformationId: string;
			recordingId: string;
		}): Promise<TransformResult<TransformationRun>> => {
			const getRecordingResult =
				await DbRecordingsService.getRecordingById(recordingId);
			if (!getRecordingResult.ok || !getRecordingResult.data) {
				return TransformError({ code: 'RECORDING_NOT_FOUND' });
			}
			const recording = getRecordingResult.data;

			return runTransformation({
				input: recording.transcribedText,
				transformationId,
				recordingId,
			});
		},
	};
}

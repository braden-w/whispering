import { settings } from '$lib/stores/settings.svelte';
import { Ok } from '@epicenterhq/result';
import { WhisperingErr, type WhisperingResult } from '@repo/shared';
import { z } from 'zod';
import type {
	DbTransformationsService,
	Transformation,
	TransformationRun,
	TransformationStep,
} from '../db';
import type { HttpService } from '../http/HttpService';

type StepResult = WhisperingResult<string>;

export const createTransformationFns = ({
	DbTransformationsService,
	HttpService,
}: {
	DbTransformationsService: DbTransformationsService;
	HttpService: HttpService;
}) => ({
	runTransformation: async ({
		maybeRecordingId,
		input,
		transformation,
	}: {
		maybeRecordingId: string | null;
		input: string;
		transformation: Transformation;
	}): Promise<WhisperingResult<TransformationRun>> => {
		const createTransformationRunResult =
			await DbTransformationsService.createTransformationRun({
				transformationId: transformation.id,
				maybeRecordingId,
				input,
			});

		if (!createTransformationRunResult.ok)
			return WhisperingErr(createTransformationRunResult.error);

		const transformationRun = createTransformationRunResult.data;

		let currentInput = input;
		for (const step of transformation.steps) {
			const newTransformationStepRunResult =
				await DbTransformationsService.addTransformationStepRunToTransformationRun(
					{
						transformationRunId: transformationRun.id,
						stepRun: { stepId: step.id, input: currentInput },
					},
				);

			if (!newTransformationStepRunResult.ok) {
				return WhisperingErr({
					title: 'Unexpected database error',
					description:
						'Unable to finish running transformation due to an unexpected database error',
					action: {
						type: 'more-details',
						error: newTransformationStepRunResult.error,
					},
				});
			}

			const newTransformationStepRun = newTransformationStepRunResult.data;

			const handleStepResult = await handleStep({
				input: currentInput,
				step,
				HttpService,
			});

			if (!handleStepResult.ok) {
				const dbResult =
					await DbTransformationsService.markTransformationRunAsFailed({
						transformationRunId: transformationRun.id,
						stepRunId: newTransformationStepRun.id,
						error: handleStepResult.error.title,
					});
				if (!dbResult.ok) {
					return WhisperingErr({
						title: 'Unexpected database error',
						description:
							'Unable to finish running transformation due to an unexpected database error',
						action: { type: 'more-details', error: handleStepResult.error },
					});
				}

				const newTransformationRunResult =
					await DbTransformationsService.getTransformationRunById(
						transformationRun.id,
					);

				if (!newTransformationRunResult.ok) {
					return WhisperingErr({
						title: 'Unexpected database error',
						description:
							'Error finding transformationRun after marking it as failed',
						action: {
							type: 'more-details',
							error: newTransformationRunResult.error,
						},
					});
				}
				const newTransformationRun = newTransformationRunResult.data;
				if (!newTransformationRun)
					return WhisperingErr({
						title: 'Unexpected database error',
						description:
							'Unable to find transformationRun after marking it as failed',
					});
				return Ok(newTransformationRun);
			}

			const dbResult =
				await DbTransformationsService.markTransformationRunStepAsCompleted({
					transformationRunId: transformationRun.id,
					stepRunId: newTransformationStepRun.id,
					output: handleStepResult.data,
				});

			if (!dbResult.ok) {
				return WhisperingErr({
					title: 'Unexpected database error',
					description:
						'Unable to finish running transformation due to an unexpected database error',
					action: { type: 'more-details', error: dbResult.error },
				});
			}

			currentInput = handleStepResult.data;
		}

		const newTransformationRunResult =
			await DbTransformationsService.getTransformationRunById(
				transformationRun.id,
			);

		if (!newTransformationRunResult.ok) {
			return WhisperingErr({
				title: 'Unexpected database error',
				description:
					'Error finding transformationRun after marking it as succeeded',
				action: {
					type: 'more-details',
					error: newTransformationRunResult.error,
				},
			});
		}
		const newTransformationRun = newTransformationRunResult.data;
		if (!newTransformationRun)
			return WhisperingErr({
				title: 'Unexpected database error',
				description:
					'Unable to find transformationRun after marking it as succeeded',
			});
		return Ok(newTransformationRun);
	},
});

async function handleStep({
	input,
	step,
	HttpService,
}: {
	input: string;
	step: TransformationStep;
	HttpService: HttpService;
}): Promise<StepResult> {
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
					const model = step['prompt_transform.inference.provider.Groq.model'];
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
}

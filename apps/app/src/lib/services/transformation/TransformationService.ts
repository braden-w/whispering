import { settings } from '$lib/stores/settings.svelte';
import { Ok } from '@epicenterhq/result';
import { WhisperingErr, type WhisperingResult } from '@repo/shared';
import type { Transformation, TransformationStep } from '../db';

type TransformationResult = WhisperingResult<string>;

export async function runTransformationOnInput(
	input: string,
	transformation: Transformation,
): Promise<TransformationResult> {
	try {
		let currentInput = input;

		for (const step of transformation.steps) {
			const result = await handleStep({ input: currentInput, step });
			if (!result.ok) return result;
			currentInput = result.data;
		}

		return Ok(currentInput);
	} catch (error) {
		return WhisperingErr({
			title: 'Transformation failed',
			description: 'An error occurred during the transformation process',
			action: { type: 'more-details', error },
		});
	}
}

async function handleStep({
	input,
	step,
}: { input: string; step: TransformationStep }): Promise<TransformationResult> {
	try {
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

				let response: Response;
				let responseText: string;

				switch (provider) {
					case 'OpenAI': {
						const model =
							step['prompt_transform.inference.provider.OpenAI.model'];
						response = await fetch(
							'https://api.openai.com/v1/chat/completions',
							{
								method: 'POST',
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
							},
						);
						const data = await response.json();
						responseText = data.choices[0]?.message?.content;
						break;
					}

					case 'Groq': {
						const model =
							step['prompt_transform.inference.provider.Groq.model'];
						response = await fetch(
							'https://api.groq.com/openai/v1/chat/completions',
							{
								method: 'POST',
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
							},
						);
						const data = await response.json();
						responseText = data.choices[0]?.message?.content;
						break;
					}

					case 'Anthropic': {
						const model =
							step['prompt_transform.inference.provider.Anthropic.model'];
						response = await fetch('https://api.anthropic.com/v1/messages', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								Authorization: `Bearer ${settings.value['apiKeys.anthropic']}`,
							},
							body: JSON.stringify({
								model,
								system: systemPrompt,
								messages: [{ role: 'user', content: userPrompt }],
							}),
						});
						const data = await response.json();
						responseText = data.content[0]?.text;
						break;
					}

					default:
						return WhisperingErr({
							title: 'Invalid provider',
							description: `Unsupported provider: ${provider}`,
						});
				}

				if (!response.ok) {
					const error = await response.json();
					return WhisperingErr({
						title: `${provider} API Error`,
						description: `Error calling ${provider} API`,
						action: { type: 'more-details', error },
					});
				}

				if (!responseText) {
					return WhisperingErr({
						title: 'Empty response',
						description: `${provider} API returned an empty response`,
					});
				}

				return Ok(responseText);
			}

			default:
				return WhisperingErr({
					title: 'Invalid step type',
					description: `Unsupported step type: ${step.type}`,
				});
		}
	} catch (error) {
		return WhisperingErr({
			title: 'Step execution failed',
			description: `Failed to execute step of type ${step.type}`,
			action: { type: 'more-details', error },
		});
	}
}

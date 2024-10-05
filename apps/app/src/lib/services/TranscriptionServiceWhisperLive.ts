import { settings } from '$lib/stores/settings.svelte.js';
import { getExtensionFromAudioBlob } from '$lib/utils';
import {
	FetchHttpClient,
	HttpClient,
	HttpClientRequest,
	HttpClientResponse,
} from '@effect/platform';
import { TranscriptionService, WhisperingError } from '@repo/shared';
import { Effect, Layer } from 'effect';
import { WhisperResponseSchema } from './transcription/WhisperResponseSchema';

const MAX_FILE_SIZE_MB = 25 as const;

export const TranscriptionServiceWhisperLive = Layer.succeed(
	TranscriptionService,
	TranscriptionService.of({
		transcribe: (audioBlob) =>
			Effect.gen(function* () {
				const { openAiApiKey: apiKey, outputLanguage } = settings.value;

				if (!apiKey) {
					return yield* new WhisperingError({
						title: 'OpenAI API Key not provided.',
						description: 'Please enter your OpenAI API key in the settings',
						action: {
							type: 'link',
							label: 'Go to settings',
							goto: '/settings/transcription',
						},
					});
				}

				if (!apiKey.startsWith('sk-')) {
					return yield* new WhisperingError({
						title: 'Invalid OpenAI API Key',
						description: 'The OpenAI API Key must start with "sk-"',
						action: {
							type: 'link',
							label: 'Update OpenAI API Key',
							goto: '/settings/transcription',
						},
					});
				}
				const blobSizeInMb = audioBlob.size / (1024 * 1024);
				if (blobSizeInMb > MAX_FILE_SIZE_MB) {
					return yield* new WhisperingError({
						title: `The file size (${blobSizeInMb}MB) is too large`,
						description: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
						action: { type: 'none' },
					});
				}
				const formDataFile = new File(
					[audioBlob],
					`recording.${getExtensionFromAudioBlob(audioBlob)}`,
					{
						type: audioBlob.type,
					},
				);
				const formData = new FormData();
				formData.append('file', formDataFile);
				formData.append('model', 'whisper-1');
				if (outputLanguage !== 'auto')
					formData.append('language', outputLanguage);
				const client = yield* HttpClient.HttpClient;
				const data = yield* HttpClientRequest.post(
					'https://api.openai.com/v1/audio/transcriptions',
				).pipe(
					HttpClientRequest.setHeaders({ Authorization: `Bearer ${apiKey}` }),
					HttpClientRequest.bodyFormData(formData),
					client.execute,
					Effect.flatMap(
						HttpClientResponse.schemaBodyJson(WhisperResponseSchema),
					),
					Effect.scoped,
					Effect.mapError((error) =>
						error._tag === 'ParseError'
							? new WhisperingError({
									title: 'Error parsing response from OpenAI API',
									description:
										'Please check logs and notify the developer if the issue persists.',
									action: {
										type: 'more-details',
										error: error.message,
									},
								})
							: new WhisperingError({
									title: 'Error sending audio to OpenAI API',
									description:
										'Please check your network connection and try again.',
									action: {
										type: 'more-details',
										error: error.message,
									},
								}),
					),
				);
				if ('error' in data) {
					return yield* new WhisperingError({
						title: 'Server error from Whisper API',
						description: 'This is likely a problem with OpenAI, not you.',
						action: {
							type: 'more-details',
							error: data.error.message,
						},
					});
				}
				return data.text;
			}).pipe(Effect.provide(FetchHttpClient.layer)),
	}),
);

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

export const TranscriptionServiceGroqLive = Layer.succeed(
	TranscriptionService,
	TranscriptionService.of({
		transcribe: (audioBlob) =>
			Effect.gen(function* () {
				const { groqApiKey: apiKey, outputLanguage } = settings.value;

				if (!apiKey) {
					return yield* new WhisperingError({
						title: 'Groq API Key not provided.',
						description: 'Please enter your Groq API key in the settings',
						action: {
							type: 'link',
							label: 'Go to settings',
							goto: '/settings/transcription',
						},
					});
				}

				if (!apiKey.startsWith('gsk_')) {
					return yield* new WhisperingError({
						title: 'Invalid Groq API Key',
						description: 'The Groq API Key must start with "gsk_"',
						action: {
							type: 'link',
							label: 'Update API Key',
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
					{ type: audioBlob.type },
				);
				const formData = new FormData();
				formData.append('file', formDataFile);
				formData.append('model', 'whisper-large-v3');
				if (outputLanguage !== 'auto')
					formData.append('language', outputLanguage);
				const client = yield* HttpClient.HttpClient;
				const data = yield* HttpClientRequest.post(
					'https://api.groq.com/openai/v1/audio/transcriptions',
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
									title: 'Error parsing response from Groq API',
									description:
										'Please check logs and notify the developer if the issue persists.',
									action: {
										type: 'more-details',
										error: error.message,
									},
								})
							: new WhisperingError({
									title: 'Error sending audio to Groq API',
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
						title: 'Server error from Groq API',
						description: 'This is likely a problem with Groq, not you.',
						action: {
							type: 'more-details',
							error: data.error.message,
						},
					});
				}
				return data.text.trim();
			}).pipe(Effect.provide(FetchHttpClient.layer)),
	}),
);

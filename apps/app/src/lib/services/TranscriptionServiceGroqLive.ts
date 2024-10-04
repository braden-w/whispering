import { settings } from '$lib/stores/settings.svelte.js';
import { getExtensionFromAudioBlob } from '$lib/utils';
import {
	HttpClient,
	HttpClientRequest,
	HttpClientResponse,
} from '@effect/platform';
import { Schema } from '@effect/schema';
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
				const data = yield* HttpClientRequest.post(
					'https://api.groq.com/openai/v1/audio/transcriptions',
				).pipe(
					HttpClientRequest.setHeaders({ Authorization: `Bearer ${apiKey}` }),
					HttpClientRequest.formDataBody(formData),
					HttpClient.fetch,
					Effect.andThen(
						HttpClientResponse.schemaBodyJson(WhisperResponseSchema),
					),
					Effect.scoped,
					Effect.mapError(
						(error) =>
							new WhisperingError({
								title: 'Error transcribing audio',
								description: error.message,
								error,
							}),
					),
				);
				if ('error' in data) {
					return yield* new WhisperingError({
						title: 'Server error from Groq API',
						description: data.error.message,
						error: data.error,
					});
				}
				return data.text.trim();
			}),
	}),
);

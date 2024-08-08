import { settings } from '$lib/stores/settings.svelte.js';
import { getExtensionFromAudioBlob } from '$lib/utils';
import { Schema } from '@effect/schema';
import { TranscriptionService, WhisperingError } from '@repo/shared';
import { Body, fetch, ResponseType } from '@tauri-apps/api/http';
import { Effect, Layer } from 'effect';

const MAX_FILE_SIZE_MB = 25 as const;

export const TranscriptionServiceWhisperWhisperServerLive = Layer.succeed(
	TranscriptionService,
	TranscriptionService.of({
		transcribe: (audioBlob) =>
			Effect.gen(function* () {
				const { outputLanguage } = settings;

				const blobSizeInMb = audioBlob.size / (1024 * 1024);
				if (blobSizeInMb > MAX_FILE_SIZE_MB) {
					return yield* new WhisperingError({
						title: `The file size (${blobSizeInMb}MB) is too large`,
						description: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
					});
				}
				const wavFile = new File([audioBlob], `recording.${getExtensionFromAudioBlob(audioBlob)}`, {
					type: audioBlob.type,
				});
				const formData = new FormData();
				formData.append('file', wavFile);
				formData.append('model', 'whisper-1');
				if (outputLanguage !== 'auto') formData.append('language', outputLanguage);
				const formBody = Body.form(formData);
				const response = yield* Effect.tryPromise({
					try: () =>
						fetch('http://localhost:8000/v1/audio/transcriptions', {
							method: 'POST',
							body: formBody,
							responseType: ResponseType.JSON,
							headers: { 'Content-Type': 'multipart/form-data' },
						}),
					catch: (error) =>
						new WhisperingError({
							title: 'Error transcribing audio',
							description: error instanceof Error ? error.message : 'Please try again.',
							error,
						}),
				});
				if (!response.ok) {
					return yield* new WhisperingError({
						title: 'Error sending audio to Faster Whisper Server',
						description:
							response.statusText ||
							'Please try again or check the Faster Whisper Server logs for more information.',
					});
				}
				const data = yield* Schema.decodeUnknown(
					Schema.Union(
						Schema.Struct({
							text: Schema.String,
						}),
						Schema.Struct({
							error: Schema.Struct({
								message: Schema.String,
							}),
						}),
					),
				)(response.data).pipe(
					Effect.mapError(
						(error) =>
							new WhisperingError({
								title: 'Error parsing reponse from Faster Whisper Server',
								description: error instanceof Error ? error.message : 'Please try again.',
								error,
							}),
					),
				);
				if ('error' in data) {
					return yield* new WhisperingError({
						title: 'Server error from Whisper API',
						description: data.error.message,
						error: data.error,
					});
				}
				return data.text;
			}),
	}),
);

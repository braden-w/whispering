import { WhisperResponseSchema } from './transcription/WhisperResponseSchema';
import { settings } from '$lib/stores/settings.svelte.js';
import { getExtensionFromAudioBlob } from '$lib/utils';
import { HttpClient, HttpClientRequest, HttpClientResponse } from '@effect/platform';
import { Schema } from '@effect/schema';
import { TranscriptionService, WhisperingError } from '@repo/shared';
import { Body, fetch, ResponseType } from '@tauri-apps/api/http';
import { Effect, Layer } from 'effect';

const MAX_FILE_SIZE_MB = 25 as const;

export const TranscriptionServiceFasterWhisperServerLive = Layer.succeed(
	TranscriptionService,
	TranscriptionService.of({
		transcribe: (audioBlob) =>
			Effect.gen(function* () {
				const { outputLanguage, fasterWhisperServerUrl, fasterWhisperServerModel } = settings.value;

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
				formData.append('model', fasterWhisperServerModel);
				if (outputLanguage !== 'auto') formData.append('language', outputLanguage);
				const data = yield* postBodyToTranscriptionServer({
					url: `${fasterWhisperServerUrl}/v1/audio/transcriptions`,
					formData,
				});
				if ('error' in data) {
					return yield* new WhisperingError({
						title: 'Server Error from faster-whisper-server',
						description: data.error.message,
						error: data.error,
					});
				}
				return data.text;
			}),
	}),
);

function postBodyToTranscriptionServer({ url, formData }: { url: string; formData: FormData }) {
	return Effect.gen(function* () {
		if (!window.__TAURI__)
			return yield* HttpClientRequest.post(url).pipe(
				HttpClientRequest.formDataBody(formData),
				HttpClient.fetch,
				Effect.andThen(HttpClientResponse.schemaBodyJson(WhisperResponseSchema)),
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
		const formBody = Body.form(formData);
		const response = yield* Effect.tryPromise({
			try: () =>
				fetch(url, {
					method: 'POST',
					body: formBody,
					responseType: ResponseType.JSON,
					headers: { 'Content-Type': 'multipart/form-data' },
				}),
			catch: (error) =>
				new WhisperingError({
					title: 'Request to Transcription Server Failed',
					description: `An error occurred while sending the request to the transcription server. ${error instanceof Error ? error.message : 'Please try again later.'}`,
					error,
				}),
		});
		if (!response.ok) {
			return yield* new WhisperingError({
				title: 'Transcription Server Response Error',
				description: `The server responded with an error: ${response.status}. Please verify the server status or try again later.`,
			});
		}
		const data = yield* Schema.decodeUnknown(WhisperResponseSchema)(response.data).pipe(
			Effect.mapError(
				(error) =>
					new WhisperingError({
						title: 'Unable to parse transcription server response',
						description: `Failed to parse the response from the transcription server. ${error instanceof Error ? error.message : 'Please try again.'}`,
						error,
					}),
			),
		);
		return data;
	});
}

import { HttpService } from '$lib/services/HttpService';
import { Schema } from '@effect/schema';
import { WhisperingError } from '@repo/shared';
import { Body, fetch, ResponseType } from '@tauri-apps/api/http';
import { Effect, Layer } from 'effect';

export const HttpServiceDesktopLive = Layer.succeed(
	HttpService,
	HttpService.of({
		post: ({ formData, url, schema }) =>
			Effect.gen(function* () {
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
				const data = yield* Schema.decodeUnknown(schema)(response.data).pipe(
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
			}),
	}),
);

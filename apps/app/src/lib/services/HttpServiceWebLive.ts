import { HttpService, HttpServiceError } from '$lib/services/HttpService';
import {
	HttpClient,
	HttpClientRequest,
	HttpClientResponse,
} from '@effect/platform';
import { WhisperingError } from '@repo/shared';
import { Effect, Layer } from 'effect';

export const HttpServiceWebLive = Layer.succeed(
	HttpService,
	HttpService.of({
		post: ({ formData, url, schema }) =>
			HttpClientRequest.post(url).pipe(
				HttpClientRequest.formDataBody(formData),
				HttpClient.fetch,
				Effect.andThen(HttpClientResponse.schemaBodyJson(schema)),
				Effect.scoped,
				Effect.mapError(
					(error) => new HttpServiceError({ message: error.message }),
				),
			),
	}),
);

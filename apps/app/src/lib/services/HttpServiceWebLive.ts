import type { HttpService } from '$lib/services/HttpService';
import { Schema } from '@effect/schema';
import { Err, tryAsync } from '@repo/shared';
import { Effect } from 'effect';

export const createHttpServiceWebLive = (): HttpService => ({
	post: async ({ formData, url, schema }) => {
		const responseResult = await tryAsync({
			try: () =>
				fetch(url, {
					method: 'POST',
					body: formData,
					headers: { 'Content-Type': 'multipart/form-data' },
				}),
			catch: (error) =>
				({
					_tag: 'NetworkError',
					message:
						error instanceof Error ? error.message : 'Please try again later.',
				}) as const,
		});
		if (!responseResult.ok) return responseResult;

		const response = responseResult.data;
		if (!response.ok) {
			return Err({
				_tag: 'HttpError',
				message: `Request failed with status ${response.status}.`,
			} as const);
		}
		const parseResult = await tryAsync({
			try: async () => {
				const json = await response.json();
				return Schema.decodeUnknown(schema)(json).pipe(Effect.runSync);
			},
			catch: (error) =>
				({
					_tag: 'ParseError',
					message:
						error instanceof Error ? error.message : 'Please try again later.',
				}) as const,
		});
		return parseResult;
	},
});

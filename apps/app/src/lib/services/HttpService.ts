import type { Schema } from '@effect/schema';
import type { BubbleError, Result } from '@repo/shared';
import { Data } from 'effect';
import { createHttpServiceDesktopLive } from './HttpServiceDesktopLive';
import { createHttpServiceWebLive } from './HttpServiceWebLive';

export class HttpServiceError extends Data.TaggedError('HttpServiceError')<{
	message: string;
}> {}

export type HttpService = {
	readonly post: <TSchema extends Schema.Schema.AnyNoContext>(config: {
		url: string;
		formData: FormData;
		schema: TSchema;
		headers?: Record<string, string>;
	}) => Promise<
		Result<
			Schema.Schema.Type<TSchema>,
			BubbleError<'NetworkError' | 'HttpError' | 'ParseError'>
		>
	>;
};

export const HttpService = window.__TAURI_INTERNALS__
	? createHttpServiceDesktopLive()
	: createHttpServiceWebLive();

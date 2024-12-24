import type { Result } from '@epicenterhq/result';
import type { z } from 'zod';
import { createHttpServiceDesktopLive } from './HttpServiceDesktopLive';
import { createHttpServiceWebLive } from './HttpServiceWebLive';
import { Err } from '@repo/shared/epicenter-result';

type HttpServiceErrCodes =
	| { code: 'NetworkError'; error: unknown }
	| { code: 'HttpError'; error: unknown; status: number }
	| { code: 'ParseError'; error: unknown };

type HttpServiceErrProperties = {
	_tag: 'HttpServiceErr';
	error: unknown;
} & HttpServiceErrCodes;

type HttpServiceResult<T> = Result<T, HttpServiceErrProperties>;

export const HttpServiceErr = (
	args: {
		error: unknown;
	} & HttpServiceErrCodes,
): HttpServiceResult<never> =>
	Err({
		_tag: 'HttpServiceErr',
		...args,
	});

export type HttpService = {
	post: <TSchema extends z.ZodTypeAny>(config: {
		url: string;
		formData: FormData;
		schema: TSchema;
		headers?: Record<string, string>;
	}) => Promise<HttpServiceResult<z.infer<TSchema>>>;
};

export const HttpService = window.__TAURI_INTERNALS__
	? createHttpServiceDesktopLive()
	: createHttpServiceWebLive();

import {
	createServiceErrorFns,
	type Result,
	tryAsync,
} from '@repo/shared/epicenter-result';
import type { z } from 'zod';
import { createHttpServiceDesktopLive } from './HttpServiceDesktopLive';
import { createHttpServiceWebLive } from './HttpServiceWebLive';

type HttpServiceErrCodes =
	| { code: 'NetworkError'; error: unknown }
	| { code: 'HttpError'; error: unknown; status: number }
	| { code: 'ParseError'; error: unknown };

export type HttpServiceErrProperties = {
	_tag: 'HttpServiceErr';
	error: unknown;
} & HttpServiceErrCodes;

export function HttpServiceErr(
	args: Omit<HttpServiceErrProperties, '_tag'> & HttpServiceErrCodes,
): HttpServiceErrProperties {
	return {
		_tag: 'HttpServiceErr',
		...args,
	};
}

export type HttpService = {
	post: <TSchema extends z.ZodTypeAny>(config: {
		url: string;
		formData: FormData;
		schema: TSchema;
		headers?: Record<string, string>;
	}) => Promise<Result<z.infer<TSchema>, HttpServiceErrProperties>>;
};

export const HttpService = window.__TAURI_INTERNALS__
	? createHttpServiceDesktopLive()
	: createHttpServiceWebLive();

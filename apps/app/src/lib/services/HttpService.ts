import { createServiceErrorFns, type Result } from '@epicenterhq/result';
import type { z } from 'zod';
import { createHttpServiceDesktopLive } from './HttpServiceDesktopLive';
import { createHttpServiceWebLive } from './HttpServiceWebLive';

export type HttpServiceErrProperties = {
	_tag: 'HttpServiceErr';
	error: unknown;
} & (
	| { code: 'NetworkError' }
	| { code: 'HttpError'; status: number }
	| { code: 'ParseError' }
);

export type HttpService = {
	post: <TSchema extends z.ZodTypeAny>(config: {
		url: string;
		formData: FormData;
		schema: TSchema;
		headers?: Record<string, string>;
	}) => Promise<Result<z.infer<TSchema>, HttpServiceErrProperties>>;
};

export const {
	Err: HttpServiceErr,
	trySync: tryHttpServiceSync,
	tryAsync: tryHttpServiceAsync,
} = createServiceErrorFns<HttpServiceErrProperties>();

export const HttpService = window.__TAURI_INTERNALS__
	? createHttpServiceDesktopLive()
	: createHttpServiceWebLive();

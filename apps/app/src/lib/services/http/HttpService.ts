import type { Ok } from '@epicenterhq/result';
import { Err } from '@epicenterhq/result';
import type { z } from 'zod';

type HttpServiceErrCodes =
	| { code: 'NetworkError'; error: unknown }
	| { code: 'HttpError'; error: unknown; status: number }
	| { code: 'ParseError'; error: unknown };

type HttpServiceErrProperties = {
	_tag: 'HttpServiceErr';
	error: unknown;
} & HttpServiceErrCodes;

export type HttpServiceErr = Err<HttpServiceErrProperties>;
export type HttpServiceResult<T> = Ok<T> | HttpServiceErr;

export const HttpServiceErr = (
	args: {
		error: unknown;
	} & HttpServiceErrCodes,
): HttpServiceErr =>
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

import type { Schema } from '@effect/schema';
import type { ParseError } from '@effect/schema/ParseResult';
import type { Effect } from 'effect';
import { Context, Data } from 'effect';

export class HttpServiceError extends Data.TaggedError('HttpServiceError')<{
	message: string;
}> {}

export class HttpService extends Context.Tag('HttpService')<
	HttpService,
	{
		readonly post: <TSchema extends Schema.Schema.AnyNoContext>(config: {
			url: string;
			formData: FormData;
			schema: TSchema;
		}) => Effect.Effect<
			Schema.Schema.Type<TSchema>,
			HttpServiceError | ParseError
		>;
	}
>() {}

import type { Schema } from '@effect/schema';
import type { WhisperingError } from '@repo/shared';
import type { Effect } from 'effect';
import { Context } from 'effect';

export class HttpService extends Context.Tag('HttpService')<
	HttpService,
	{
		readonly post: <TSchema extends Schema.Schema.AnyNoContext>(config: {
			url: string;
			formData: FormData;
			schema: TSchema;
		}) => Effect.Effect<Schema.Schema.Type<TSchema>, WhisperingError>;
	}
>() {}

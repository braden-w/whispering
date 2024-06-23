import { Schema as S } from '@effect/schema';
import type { Effect } from 'effect';
import { Context } from 'effect';
import { BaseError } from '../index.js';

export const notificationOptionsSchema = S.Struct({
	id: S.optional(S.String),
	...BaseError.fields,
});

type NotificationOptions = S.Schema.Type<typeof notificationOptionsSchema>;

export class NotificationService extends Context.Tag('NotificationService')<
	NotificationService,
	{
		notify: (options: NotificationOptions) => Effect.Effect<string>;
		clear: (id: string) => Effect.Effect<void>;
	}
>() {}

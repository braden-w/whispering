import { Schema as S } from '@effect/schema';
import type { Result } from '../index.js';

export const notificationOptionsSchema = S.Struct({
	id: S.optional(S.String),
	title: S.String,
	description: S.String,
	action: S.optional(
		S.Struct({
			type: S.Literal('link'),
			label: S.String,
			goto: S.String,
		}),
	),
});

export type NotificationOptions = S.Schema.Type<
	typeof notificationOptionsSchema
>;

export type NotificationService = {
	notify: (options: NotificationOptions) => Promise<Result<string>>;
	clear: (id: string) => Promise<Result<void>> | Result<void>;
};

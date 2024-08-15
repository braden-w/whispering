import { Schema } from '@effect/schema';

export const WhisperResponseSchema = Schema.Union(
	Schema.Struct({
		text: Schema.String,
	}),
	Schema.Struct({
		error: Schema.Struct({
			message: Schema.String,
		}),
	}),
);

import { Schema } from '@effect/schema';
import type { ParseError } from '@effect/schema/ParseResult';
import { Storage, type StorageWatchCallback } from '@plasmohq/storage';
import { WhisperingError, recorderStateSchema } from '@repo/shared';
import { Console, Effect } from 'effect';
import { renderErrorAsNotification } from '~lib/errors';
import { NotificationServiceBgswLive } from './NotificationServiceBgswLive';

export const STORAGE_KEYS = {
	RECORDER_STATE: 'whispering-recorder-state',
	LATEST_RECORDING_TRANSCRIBED_TEXT:
		'whispering-latest-recording-transcribed-text',
	SETTINGS: 'whispering-settings',
} as const;

const storage = new Storage();

const createSetWatch = <
	TSchema extends Schema.Schema.AnyNoContext,
	A = Schema.Schema.Type<TSchema>,
>({
	key,
	schema,
}: {
	key: string;
	schema: TSchema;
}) => {
	const parseValueFromStorage = (
		valueFromStorage: unknown,
	): Effect.Effect<A, ParseError> =>
		Schema.decodeUnknown(Schema.parseJson(schema))(valueFromStorage);
	return {
		set: (value: A) => Effect.promise(() => storage.set(key, value)),
		watch: (callback: (newValue: A) => void) => {
			const listener: StorageWatchCallback = ({ newValue: newValueUnparsed }) =>
				Effect.gen(function* () {
					const newValue: A = yield* parseValueFromStorage(
						newValueUnparsed,
					).pipe(
						Effect.mapError((error) => ({
							_tag: 'WhisperingError',
							title: 'Unable to parse storage value',
							description:
								'There was an error running Schema.decodeUnknown on the storage value.',
							action: {
								type: 'more-details',
								error,
							},
						})),
					);
					yield* Console.info('watch', key, newValue);
					callback(newValue);
				}).pipe(
					Effect.catchAll(renderErrorAsNotification),
					Effect.provide(NotificationServiceBgswLive),
					Effect.runSync,
				);
			return Effect.sync(() => storage.watch({ [key]: listener }));
		},
	};
};

export const extensionStorageService = {
	[STORAGE_KEYS.RECORDER_STATE]: createSetWatch({
		key: STORAGE_KEYS.RECORDER_STATE,
		schema: recorderStateSchema,
	}),
	[STORAGE_KEYS.LATEST_RECORDING_TRANSCRIBED_TEXT]: createSetWatch({
		key: STORAGE_KEYS.LATEST_RECORDING_TRANSCRIBED_TEXT,
		schema: Schema.String,
	}),
} as const;

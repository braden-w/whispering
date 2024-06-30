import { Schema as S } from '@effect/schema';
import { Storage, type StorageWatchCallback } from '@plasmohq/storage';
import { WhisperingError, recorderStateSchema } from '@repo/shared';
import { Console, Effect } from 'effect';
import { renderErrorAsNotification } from '~lib/errors';
import { NotificationServiceBgswLive } from './NotificationServiceBgswLive';
import type { ParseError } from '@effect/schema/ParseResult';

export const STORAGE_KEYS = {
	RECORDER_STATE: 'whispering-recorder-state',
	LATEST_RECORDING_TRANSCRIBED_TEXT: 'whispering-latest-recording-transcribed-text',
	SETTINGS: 'whispering-settings',
} as const;

const storage = new Storage();

const createSetWatch = <TSchema extends S.Schema.AnyNoContext, A = S.Schema.Type<TSchema>>({
	key,
	schema,
}: {
	key: string;
	schema: TSchema;
}) => {
	const parseValueFromStorage = (valueFromStorage: unknown) => {
		const jsonSchema = S.parseJson(schema);
		return S.decodeUnknown(jsonSchema)(valueFromStorage) satisfies Effect.Effect<A, ParseError>;
	};
	return {
		set: (value: A) => Effect.promise(() => storage.set(key, value)),
		watch: (callback: (newValue: A) => void) => {
			const listener: StorageWatchCallback = ({ newValue: newValueUnparsed }) =>
				Effect.gen(function* () {
					const newValue: A = yield* parseValueFromStorage(newValueUnparsed).pipe(
						Effect.mapError(
							(error) =>
								new WhisperingError({
									title: 'Unable to parse storage value',
									description: error instanceof Error ? error.message : `Unknown error: ${error}`,
									error,
								}),
						),
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
		schema: S.String,
	}),
} as const;

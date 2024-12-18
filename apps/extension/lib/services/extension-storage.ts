import { Schema } from '@effect/schema';
import { Storage, type StorageWatchCallback } from '@plasmohq/storage';
import { Err, Ok, parseJson, recorderStateSchema } from '@repo/shared';
import { Console, Effect } from 'effect';
import { renderErrorAsNotification } from '~lib/errors';
import { NotificationServiceBgswLive } from './NotificationServiceBgswLive';
import type { z } from 'zod';

export const STORAGE_KEYS = {
	RECORDER_STATE: 'whispering-recorder-state',
	LATEST_RECORDING_TRANSCRIBED_TEXT:
		'whispering-latest-recording-transcribed-text',
	SETTINGS: 'whispering-settings',
} as const;

const storage = new Storage();

const createSetWatch = <TSchema extends z.ZodSchema, A = z.infer<TSchema>>({
	key,
	schema,
}: {
	key: string;
	schema: TSchema;
}) => {
	const parseValueFromStorage = (valueFromStorage: unknown) => {
		const parseJsonResult = parseJson(valueFromStorage);
		if (!parseJsonResult.ok) {
			return parseJsonResult;
		}
		const valueFromStorageMaybeInvalid = parseJsonResult.data;
		const parseResult = schema.safeParse(valueFromStorageMaybeInvalid);
		if (!parseResult.success) {
			return Err({
				_tag: 'WhisperingError',
				title: 'Unable to parse storage value',
				description:
					'There was an error running Schema.decodeUnknown on the storage value.',
				action: {
					type: 'more-details',
					error: parseResult.error,
				},
			});
		}
		return Ok(parseResult.data);
	};

	return {
		set: (value: A) => Effect.promise(() => storage.set(key, value)),
		watch: (callback: (newValue: A) => void) => {
			const listener = (({ newValue: newValueUnparsed }) => {
				const parseResult = parseValueFromStorage(newValueUnparsed);
				if (!parseResult.ok) return parseResult;
				const newValue: A = parseResult.data;
				console.info('watch', key, newValue);
				callback(newValue);
				return Ok(undefined);
			}) satisfies StorageWatchCallback;

			storage.watch({
				[key]: (...props) => {
					renderErrorAsNotification(listener(...props));
				},
			});
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

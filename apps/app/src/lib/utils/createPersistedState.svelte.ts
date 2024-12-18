import { toast } from '$lib/services/ToastService';
import { parseJson } from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import type { z } from 'zod';

/**
 * Creates a persisted state object tied to local storage, accessible through `.value`
 */
export function createPersistedState<TSchema extends z.ZodTypeAny>({
	key,
	schema,
	defaultValue,
	disableLocalStorage = false,
	resolveParseError = () => defaultValue,
}: {
	/** The key used to store the value in local storage. */
	key: string;
	/**
	 * The schema is used to validate the value from local storage
	 * (`defaultValue` will be used if the value from local storage is invalid).
	 * */
	schema: TSchema;
	/**
	 * The default value to use if no value is found in local storage or the value
	 * from local storage fails to pass the schema.
	 * */
	defaultValue: z.infer<TSchema>;
	/**
	 * If true, disables the use of local storage. In SvelteKit, you set
	 * this to `!browser` because local storage doesn't exist in the server
	 * context.
	 *
	 * @example
	 *
	 * ```ts
	 * import { browser } from '$app/environment';
	 * ...
	 * const state = createPersistedState({ ..., disableLocalStorage: !browser })
	 * ...
	 * ```
	 * */
	disableLocalStorage?: boolean;
	/**
	 * Handler for when the value from storage fails schema validation.
	 * Return a valid value to use it and save to storage.
	 * @default `() => defaultValue`
	 */
	resolveParseError?: (params: {
		/** The value from storage that failed schema validation. */
		valueFromStorage: unknown;
		/** The default value to use if the value from storage fails schema validation. */
		defaultValue: z.infer<TSchema>;
		/** The schema used to validate the value from storage. */
		schema: TSchema;
		/** The error that occurred when parsing the value from storage. */
		error: z.ZodError;
	}) => z.infer<TSchema>;
}) {
	let value = $state(defaultValue);

	const parseValueFromStorage = (
		valueFromStorageUnparsed: string | null,
	): z.infer<TSchema> => {
		const isEmpty = valueFromStorageUnparsed === null;
		if (isEmpty) return defaultValue;

		const parseJsonResult = parseJson(valueFromStorageUnparsed);
		if (!parseJsonResult.ok) return defaultValue;
		const valueFromStorageMaybeInvalid = parseJsonResult.data;

		const valueFromStorageResult = schema.safeParse(
			valueFromStorageMaybeInvalid,
		);
		if (valueFromStorageResult.success) return valueFromStorageResult.data;

		const resolvedValue = resolveParseError({
			valueFromStorage: valueFromStorageMaybeInvalid,
			defaultValue,
			schema,
			error: valueFromStorageResult.error,
		});

		localStorage.setItem(key, JSON.stringify(resolvedValue));
		return resolvedValue;
	};

	if (!disableLocalStorage) {
		value = parseValueFromStorage(localStorage.getItem(key));
		window.addEventListener('storage', (event: StorageEvent) => {
			if (event.key !== key) return;
			value = parseValueFromStorage(event.newValue);
		});
		window.addEventListener('focus', () => {
			value = parseValueFromStorage(localStorage.getItem(key));
		});
	}

	return {
		get value() {
			return value;
		},
		set value(newValue: z.infer<TSchema>) {
			value = newValue;
			if (!disableLocalStorage)
				localStorage.setItem(key, JSON.stringify(newValue));
		},
	};
}

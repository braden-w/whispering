import { toast } from '$lib/services/ToastService';
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
}) {
	let value = $state(defaultValue);

	const parseValueFromStorage = (
		valueFromStorageUnparsed: string | null,
	): z.infer<TSchema> => {
		const isEmpty = valueFromStorageUnparsed === null;
		if (isEmpty) return defaultValue;
		try {
			const valueFromStorage = schema.parse(
				JSON.parse(valueFromStorageUnparsed),
			);
			return valueFromStorage as z.infer<TSchema>;
		} catch (error) {
			const updatingLocalStorageToastId = nanoid();
			toast({
				variant: 'loading',
				title: `Updating "${key}" in local storage...`,
				description: 'Please wait...',
			});
			// Attempt to merge the default value with the value from storage if possible
			const oldValueFromStorageMaybeInvalid = JSON.parse(
				valueFromStorageUnparsed,
			);
			const defaultValueMergedOldValues = {
				...defaultValue,
				...oldValueFromStorageMaybeInvalid,
			};

			try {
				const updatedValue: z.infer<TSchema> = schema.parse(
					defaultValueMergedOldValues,
				);
				toast({
					id: updatingLocalStorageToastId,
					variant: 'success',
					title: `Successfully updated "${key}" in local storage`,
					description: 'The value has been updated.',
				});
				localStorage.setItem(key, JSON.stringify(updatedValue));
				return updatedValue;
			} catch (error) {
				toast({
					id: updatingLocalStorageToastId,
					variant: 'error',
					title: `Error updating "${key}" in local storage`,
					description: 'Reverting to default value.',
				});
				localStorage.setItem(key, JSON.stringify(defaultValue));
				return defaultValue;
			}
		}
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

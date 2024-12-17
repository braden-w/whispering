import { toast } from '$lib/services/ToastService';
import { Schema as S } from '@effect/schema';
import { Effect, Either } from 'effect';
import { nanoid } from 'nanoid/non-secure';

/**
 * Creates a persisted state object tied to local storage, accessible through `.value`
 */
export function createPersistedState<TSchema extends S.Schema.AnyNoContext>({
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
	defaultValue: S.Schema.Type<TSchema>;
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
	): S.Schema.Type<TSchema> => {
		const isEmpty = valueFromStorageUnparsed === null;
		if (isEmpty) return defaultValue;
		const jsonSchema = S.parseJson(schema);
		const maybeParsedValue = S.decodeUnknownEither(jsonSchema)(
			valueFromStorageUnparsed,
		);
		if (Either.isRight(maybeParsedValue)) {
			const parsedValue = maybeParsedValue.right;
			return parsedValue as S.Schema.Type<TSchema>;
		}

		return Effect.gen(function* () {
			const updatingLocalStorageToastId = nanoid();
			toast({
				variant: 'loading',
				title: `Updating "${key}" in local storage...`,
				description: 'Please wait...',
			});
			// Attempt to merge the default value with the value from storage if possible
			const oldValueFromStorageMaybeInvalid = yield* S.decodeUnknown(
				S.parseJson(S.Any),
			)(valueFromStorageUnparsed);
			const defaultValueMergedOldValues = {
				...defaultValue,
				...oldValueFromStorageMaybeInvalid,
			};

			const updatedValue: S.Schema.Type<TSchema> = yield* S.decodeUnknown(
				schema,
			)(defaultValueMergedOldValues).pipe(
				Effect.tap(() =>
					toast({
						id: updatingLocalStorageToastId,
						variant: 'success',
						title: `Successfully updated "${key}" in local storage`,
						description: 'The value has been updated.',
					}),
				),
				Effect.tapError(() =>
					toast({
						id: updatingLocalStorageToastId,
						variant: 'error',
						title: `Error updating "${key}" in local storage`,
						description: 'Reverting to default value.',
					}),
				),
				Effect.catchAll(() => Effect.succeed(defaultValue)),
			);

			localStorage.setItem(key, JSON.stringify(updatedValue));
			return updatedValue;
		}).pipe(Effect.runSync);
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
		set value(newValue: S.Schema.Type<TSchema>) {
			value = newValue;
			if (!disableLocalStorage)
				localStorage.setItem(key, JSON.stringify(newValue));
		},
	};
}

import { browser } from '$app/environment';
import type { DefaultError } from '@tanstack/query-core';
import { MutationObserver, QueryClient } from '@tanstack/query-core';
import type {
	CreateMutateFunction,
	CreateMutationOptions,
	CreateMutationResult,
} from '@tanstack/svelte-query';
import { createSubscriber } from 'svelte/reactivity';
import type { Accessor } from './types';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			enabled: browser,
		},
	},
});

export function createMutation<
	TData = unknown,
	TError = DefaultError,
	TVariables = void,
	TContext = unknown,
>(
	options: Accessor<CreateMutationOptions<TData, TError, TVariables, TContext>>,
): CreateMutationResult<TData, TError, TVariables, TContext> {
	const observer = new MutationObserver<TData, TError, TVariables, TContext>(
		queryClient,
		options(),
	);

	// Create subscriber to handle reactivity
	const subscribe = createSubscriber((update) => {
		// Update options and setup subscription when first subscriber is added
		observer.setOptions(options());
		const unsubscribe = observer.subscribe(() => {
			update(); // Trigger re-runs of effects that depend on the result
		});
		return unsubscribe; // Cleanup when no more subscribers
	});

	return new Proxy(
		{},
		{
			get: (_, anyProperty) => {
				// Trigger subscription when accessing any property
				subscribe();
				const currentResult = observer.getCurrentResult();

				const result = {
					...currentResult,
					mutate: (variables, mutateOptions) => {
						observer.mutate(variables, mutateOptions).catch(noop);
					},
					mutateAsync: currentResult.mutate,
				} satisfies CreateMutationResult<TData, TError, TVariables, TContext>;

				if (anyProperty === 'value') return currentResult;
				return Reflect.get(result, anyProperty);
			},
		},
	) as CreateMutationResult<TData, TError, TVariables, TContext>;
}

function noop() {}

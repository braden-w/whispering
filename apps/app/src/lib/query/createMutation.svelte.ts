import type { DefaultError } from '@tanstack/query-core';
import {
	MutationObserver,
	notifyManager,
	QueryClient,
} from '@tanstack/query-core';
import type {
	CreateMutateFunction,
	CreateMutationOptions,
	CreateMutationResult,
} from '@tanstack/svelte-query';
import type { Accessor } from './types';
import { browser } from '$app/environment';

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
) {
	const observer = $derived(
		new MutationObserver<TData, TError, TVariables, TContext>(
			queryClient,
			options(),
		),
	);

	const mutate: CreateMutateFunction<TData, TError, TVariables, TContext> = (
		variables,
		mutateOptions,
	) => {
		observer.mutate(variables, mutateOptions).catch(noop);
	};

	$effect.root(() => {
		$effect.pre(() => {
			observer.setOptions(options());
		});
	});

	const result = $state(observer.getCurrentResult());

	$effect.root(() => {
		$effect(() => {
			const unsubscribe = observer.subscribe((val) => {
				notifyManager.batchCalls(() => {
					Object.assign(result, val);
				})();
			});

			return unsubscribe;
		});
	});

	return new Proxy(result, {
		get: (_, prop) => {
			const r = {
				...result,
				mutate,
				mutateAsync: result.mutate,
			};
			if (prop === 'value') return r;
			return r[prop];
		},
	}) satisfies CreateMutationResult<TData, TError, TVariables, TContext>;
}

function noop() {}

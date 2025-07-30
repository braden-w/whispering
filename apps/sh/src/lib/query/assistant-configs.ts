import { trpc } from '$lib/api/trpc-client';
import { ShErr } from '$lib/result';
import type {
	AssistantConfigInsert,
	AssistantConfigUpdate,
} from '@repo/db/schema';
import type { Accessor } from '@tanstack/svelte-query';
import { TRPCClientError } from '@trpc/client';
import { Err, Ok, tryAsync } from 'wellcrafted/result';

import { defineMutation, defineQuery, queryClient } from './_client';

// Query for fetching all assistant configs
export const getAssistantConfigs = defineQuery({
	queryKey: ['assistantConfigs'],
	resultQueryFn: async () => {
		const { data, error } = await tryAsync({
			try: () => trpc.assistantConfig.list.query(),
			mapErr: (error) => {
				if (error instanceof TRPCClientError) {
					return ShErr({
						title: 'Failed to fetch assistant configs',
						description: error.message,
					});
				}
				return ShErr({
					title: 'Failed to fetch assistant configs',
					description: 'An unexpected error occurred',
				});
			},
		});

		if (error) return Err(error);
		return Ok(data);
	},
});

// Query for fetching a single assistant config
export const getAssistantConfigById = (id: Accessor<string>) =>
	defineQuery({
		queryKey: ['assistantConfigs', id()],
		resultQueryFn: async () => {
			const { data, error } = await tryAsync({
				try: () => trpc.assistantConfig.getById.query({ id: id() }),
				mapErr: (error) => {
					if (error instanceof TRPCClientError) {
						return ShErr({
							title: 'Failed to fetch assistant config',
							description: error.message,
						});
					}
					return ShErr({
						title: 'Failed to fetch assistant config',
						description: 'An unexpected error occurred',
					});
				},
			});

			if (error) return Err(error);
			return Ok(data);
		},
	});

// Mutation for creating an assistant config
export const createAssistantConfig = defineMutation({
	mutationKey: ['createAssistantConfig'],
	onSuccess: () => {
		queryClient.invalidateQueries({
			queryKey: ['assistantConfigs'],
		});
	},
	resultMutationFn: async (params: Omit<AssistantConfigInsert, 'userId'>) => {
		const { data, error } = await tryAsync({
			try: () => trpc.assistantConfig.create.mutate(params),
			mapErr: (error) => {
				if (error instanceof TRPCClientError) {
					return ShErr({
						title: 'Failed to create assistant config',
						description: error.message,
					});
				}
				return ShErr({
					title: 'Failed to create assistant config',
					description: 'An unexpected error occurred',
				});
			},
		});

		if (error) return Err(error);
		return Ok(data);
	},
});

// Mutation for updating an assistant config
export const updateAssistantConfig = defineMutation({
	mutationKey: ['updateAssistantConfig'],
	onSuccess: (_, { id }) => {
		queryClient.invalidateQueries({
			queryKey: ['assistantConfigs'],
		});
		queryClient.invalidateQueries({
			queryKey: ['assistantConfigs', id],
		});
	},
	resultMutationFn: async ({
		id,
		...params
	}: Omit<AssistantConfigUpdate, 'userId'>) => {
		const { data, error } = await tryAsync({
			try: () => trpc.assistantConfig.update.mutate({ id, ...params }),
			mapErr: (error) => {
				if (error instanceof TRPCClientError) {
					return ShErr({
						title: 'Failed to update assistant config',
						description: error.message,
					});
				}
				return ShErr({
					title: 'Failed to update assistant config',
					description: 'An unexpected error occurred',
				});
			},
		});

		if (error) return Err(error);
		return Ok(data);
	},
});

// Mutation for deleting an assistant config
export const deleteAssistantConfig = defineMutation({
	mutationKey: ['deleteAssistantConfig'],
	onSuccess: () => {
		queryClient.invalidateQueries({
			queryKey: ['assistantConfigs'],
		});
	},
	resultMutationFn: async ({ id }: { id: string }) => {
		const { error } = await tryAsync({
			try: () => trpc.assistantConfig.delete.mutate({ id }),
			mapErr: (error) => {
				if (error instanceof TRPCClientError) {
					return ShErr({
						title: 'Failed to delete assistant config',
						description: error.message,
					});
				}
				return ShErr({
					title: 'Failed to delete assistant config',
					description: 'An unexpected error occurred',
				});
			},
		});

		if (error) return Err(error);
		return Ok(undefined);
	},
});

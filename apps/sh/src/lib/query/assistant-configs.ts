import type { Accessor } from '@tanstack/svelte-query';
import { type } from 'arktype';
import { ShErr } from '$lib/result';
import { extractErrorMessage } from 'wellcrafted/error';
import { Ok } from 'wellcrafted/result';

import { defineMutation, defineQuery, queryClient } from './_client';

// Re-export types from the store for compatibility
export { type AssistantConfig, type CreateAssistantParams, type UpdateAssistantParams } from '$lib/stores/assistant-configs.svelte';

// Type for API responses
type ApiAssistantConfig = {
	id: string;
	userId: string;
	name: string;
	url: string;
	port: number;
	password: string | null;
	createdAt: string;
	lastAccessedAt: string;
	updatedAt: string;
};

// Convert API response to client format
function toAssistantConfig(apiConfig: ApiAssistantConfig) {
	return {
		id: apiConfig.id,
		name: apiConfig.name,
		url: apiConfig.url,
		port: apiConfig.port,
		password: apiConfig.password,
		createdAt: new Date(apiConfig.createdAt).getTime(),
		lastAccessedAt: new Date(apiConfig.lastAccessedAt).getTime(),
	};
}

// Get the API URL - this should come from env vars in production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

// Helper to get auth headers
function getAuthHeaders() {
	// This should get the session token from your auth system
	// For now, returning empty headers - you'll need to implement this
	return {
		'Authorization': `Bearer ${localStorage.getItem('sessionToken') || ''}`,
		'Content-Type': 'application/json',
	};
}

// Query for fetching all assistant configs
export const getAssistantConfigs = defineQuery({
	queryKey: ['assistantConfigs'],
	resultQueryFn: async () => {
		try {
			const response = await fetch(`${API_URL}/assistant-configs`, {
				headers: getAuthHeaders(),
			});

			if (!response.ok) {
				const error = await response.json();
				return ShErr({
					title: 'Failed to fetch assistant configs',
					description: error.error || 'Unknown error occurred',
				});
			}

			const data: ApiAssistantConfig[] = await response.json();
			return Ok(data.map(toAssistantConfig));
		} catch (error) {
			return ShErr({
				title: 'Failed to fetch assistant configs',
				description: extractErrorMessage(error),
			});
		}
	},
});

// Query for fetching a single assistant config
export const getAssistantConfigById = (id: Accessor<string>) =>
	defineQuery({
		queryKey: ['assistantConfigs', id()],
		resultQueryFn: async () => {
			try {
				const response = await fetch(`${API_URL}/assistant-configs/${id()}`, {
					headers: getAuthHeaders(),
				});

				if (!response.ok) {
					const error = await response.json();
					return ShErr({
						title: 'Failed to fetch assistant config',
						description: error.error || 'Unknown error occurred',
					});
				}

				const data: ApiAssistantConfig = await response.json();
				return Ok(toAssistantConfig(data));
			} catch (error) {
				return ShErr({
					title: 'Failed to fetch assistant config',
					description: extractErrorMessage(error),
				});
			}
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
	resultMutationFn: async (params: {
		name: string;
		url: string;
		port: number;
		password: string | null;
	}) => {
		try {
			const response = await fetch(`${API_URL}/assistant-configs`, {
				method: 'POST',
				headers: getAuthHeaders(),
				body: JSON.stringify(params),
			});

			if (!response.ok) {
				const error = await response.json();
				return ShErr({
					title: 'Failed to create assistant config',
					description: error.error || 'Unknown error occurred',
				});
			}

			const data: ApiAssistantConfig = await response.json();
			return Ok(toAssistantConfig(data));
		} catch (error) {
			return ShErr({
				title: 'Failed to create assistant config',
				description: extractErrorMessage(error),
			});
		}
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
	}: {
		id: string;
		name?: string;
		url?: string;
		port?: number;
		password?: string | null;
	}) => {
		try {
			const response = await fetch(`${API_URL}/assistant-configs/${id}`, {
				method: 'PUT',
				headers: getAuthHeaders(),
				body: JSON.stringify(params),
			});

			if (!response.ok) {
				const error = await response.json();
				return ShErr({
					title: 'Failed to update assistant config',
					description: error.error || 'Unknown error occurred',
				});
			}

			const data: ApiAssistantConfig = await response.json();
			return Ok(toAssistantConfig(data));
		} catch (error) {
			return ShErr({
				title: 'Failed to update assistant config',
				description: extractErrorMessage(error),
			});
		}
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
		try {
			const response = await fetch(`${API_URL}/assistant-configs/${id}`, {
				method: 'DELETE',
				headers: getAuthHeaders(),
			});

			if (!response.ok) {
				const error = await response.json();
				return ShErr({
					title: 'Failed to delete assistant config',
					description: error.error || 'Unknown error occurred',
				});
			}

			return Ok(undefined);
		} catch (error) {
			return ShErr({
				title: 'Failed to delete assistant config',
				description: extractErrorMessage(error),
			});
		}
	},
});

// Store-like wrapper for migration compatibility
export const assistantConfigs = {
	// Use the query to get all configs
	get value() {
		// This is a reactive wrapper that components can use
		// In actual usage, components should use createQuery directly
		return [];
	},
	
	create: createAssistantConfig.execute,
	update: (id: string, params: any) => updateAssistantConfig.execute({ id, ...params }),
	delete: (id: string) => deleteAssistantConfig.execute({ id }),
	
	// Helper to get by ID from the cached list
	getById: (id: string) => {
		const cached = queryClient.getQueryData(['assistantConfigs']) as any;
		if (cached?.data) {
			return cached.data.find((c: any) => c.id === id);
		}
		return undefined;
	},
};
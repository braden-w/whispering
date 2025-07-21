import * as api from '$lib/client/sdk.gen';
import type { PostSessionByIdSummarizeData } from '$lib/client/types.gen';
import { createWorkspaceClient } from '$lib/client/client.gen';
import { ShErr } from '$lib/result';
import type { WorkspaceConfig } from '$lib/stores/workspaces.svelte';
import type { Accessor } from '@tanstack/svelte-query';
import { extractErrorMessage } from 'wellcrafted/error';
import { Ok } from 'wellcrafted/result';
import { defineMutation, defineQuery, queryClient } from './_client';

// Query for fetching all sessions in a workspace
export const getSessions = (workspaceConfig: Accessor<WorkspaceConfig>) =>
	defineQuery({
		queryKey: ['workspaces', workspaceConfig().id, 'sessions'],
		resultQueryFn: async () => {
			const client = createWorkspaceClient(workspaceConfig());

			const { data, error } = await api.getSession({ client });
			if (error) {
				return ShErr({
					title: 'Failed to fetch sessions',
					description: extractErrorMessage(error),
				});
			}

			return Ok(data);
		},
	});

// Mutation for creating a new session
export const createSession = defineMutation({
	mutationKey: ['createSession'],
	resultMutationFn: async ({
		workspaceConfig,
	}: { workspaceConfig: WorkspaceConfig }) => {
		const client = createWorkspaceClient(workspaceConfig);

		const { data: session, error } = await api.postSession({ client });
		if (error) {
			return ShErr({
				title: 'Failed to create session',
				description: extractErrorMessage(error),
			});
		}
		return Ok(session);
	},
	onSuccess: (_, { workspaceConfig }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspaceConfig.id, 'sessions'],
		});
	},
});

// Mutation for deleting a session
export const deleteSession = defineMutation({
	mutationKey: ['deleteSession'],
	resultMutationFn: async ({
		workspaceConfig,
		sessionId,
	}: {
		workspaceConfig: WorkspaceConfig;
		sessionId: string;
	}) => {
		const client = createWorkspaceClient(workspaceConfig);

		const { data, error } = await api.deleteSessionById({
			client,
			path: { id: sessionId },
		});
		if (error) {
			return ShErr({
				title: 'Failed to delete session',
				description: extractErrorMessage(error),
			});
		}
		return Ok(data);
	},
	onSuccess: (_, { workspaceConfig }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspaceConfig.id, 'sessions'],
		});
	},
});

// Mutation for sharing a session
export const shareSession = defineMutation({
	mutationKey: ['shareSession'],
	resultMutationFn: async ({
		workspaceConfig,
		id,
	}: {
		workspaceConfig: WorkspaceConfig;
		id: string;
	}) => {
		const client = createWorkspaceClient(workspaceConfig);

		const { data, error } = await api.postSessionByIdShare({
			client,
			path: { id },
		});
		if (error) {
			return ShErr({
				title: 'Failed to share session',
				description: extractErrorMessage(error),
			});
		}
		return Ok(data);
	},
	onSuccess: (_, { workspaceConfig }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspaceConfig.id, 'sessions'],
		});
	},
});

// Mutation for unsharing a session
export const unshareSession = defineMutation({
	mutationKey: ['unshareSession'],
	resultMutationFn: async ({
		workspaceConfig,
		id,
	}: {
		workspaceConfig: WorkspaceConfig;
		id: string;
	}) => {
		const client = createWorkspaceClient(workspaceConfig);

		const { data, error } = await api.deleteSessionByIdShare({
			client,
			path: { id },
		});
		if (error) {
			return ShErr({
				title: 'Failed to unshare session',
				description: extractErrorMessage(error),
			});
		}
		return Ok(data);
	},
	onSuccess: (_, { workspaceConfig }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspaceConfig.id, 'sessions'],
		});
	},
});

// Mutation for aborting a session
export const abortSession = defineMutation({
	mutationKey: ['abortSession'],
	resultMutationFn: async ({
		workspaceConfig,
		id,
	}: {
		workspaceConfig: WorkspaceConfig;
		id: string;
	}) => {
		const client = createWorkspaceClient(workspaceConfig);

		const { data, error } = await api.postSessionByIdAbort({
			client,
			path: { id },
		});
		if (error) {
			return ShErr({
				title: 'Failed to abort session',
				description: extractErrorMessage(error),
			});
		}
		return Ok(data);
	},
	onSuccess: (_, { workspaceConfig }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspaceConfig.id, 'sessions'],
		});
	},
});

// Mutation for initializing a session
export const initializeSession = defineMutation({
	mutationKey: ['initializeSession'],
	resultMutationFn: async ({
		workspaceConfig,
		id,
		body,
	}: {
		workspaceConfig: WorkspaceConfig;
		id: string;
		body?: { providerID: string; modelID: string; messageID: string };
	}) => {
		const client = createWorkspaceClient(workspaceConfig);

		const { data, error } = await api.postSessionByIdInit({
			client,
			path: { id },
			body,
		});
		if (error) {
			return ShErr({
				title: 'Failed to initialize session',
				description: extractErrorMessage(error),
			});
		}
		return Ok(data);
	},
	onSuccess: (_, { workspaceConfig }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspaceConfig.id, 'sessions'],
		});
	},
});

// Mutation for summarizing a session
export const summarizeSession = defineMutation({
	mutationKey: ['summarizeSession'],
	resultMutationFn: async ({
		workspaceConfig,
		sessionId,
		body,
	}: {
		workspaceConfig: WorkspaceConfig;
		sessionId: string;
		body: PostSessionByIdSummarizeData['body'];
	}) => {
		const client = createWorkspaceClient(workspaceConfig);

		const { data, error } = await api.postSessionByIdSummarize({
			client,
			path: { id: sessionId },
			body,
		});
		if (error) {
			return ShErr({
				title: 'Failed to summarize session',
				description: extractErrorMessage(error),
			});
		}
		return Ok(data);
	},
	onSuccess: (_, { workspaceConfig }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspaceConfig.id, 'sessions'],
		});
	},
});

// Query for fetching a single session by ID
export const getSessionById = (
	workspaceConfig: Accessor<WorkspaceConfig>,
	sessionId: Accessor<string>,
) =>
	defineQuery({
		queryKey: ['workspaces', workspaceConfig().id, 'sessions'],
		resultQueryFn: async () => {
			const client = createWorkspaceClient(workspaceConfig());

			const { data, error } = await api.getSession({ client });
			if (error) {
				return ShErr({
					title: 'Failed to fetch sessions',
					description: extractErrorMessage(error),
				});
			}

			return Ok(data);
		},
		select: (sessions) => sessions?.find((s) => s.id === sessionId()),
	});

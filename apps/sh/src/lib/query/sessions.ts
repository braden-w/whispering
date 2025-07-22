import type { PostSessionByIdSummarizeData } from '$lib/client/types.gen';
import type { WorkspaceConfig } from '$lib/stores/workspace-configs.svelte';
import type { Accessor } from '@tanstack/svelte-query';

import { createWorkspaceClient } from '$lib/client/client.gen';
import * as api from '$lib/client/sdk.gen';
import { ShErr } from '$lib/result';
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
					description: extractErrorMessage(error),
					title: 'Failed to fetch sessions',
				});
			}

			return Ok(data);
		},
	});

// Mutation for creating a new session
export const createSession = defineMutation({
	mutationKey: ['createSession'],
	onSuccess: (_, { workspaceConfig }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspaceConfig.id, 'sessions'],
		});
	},
	resultMutationFn: async ({
		workspaceConfig,
	}: {
		workspaceConfig: WorkspaceConfig;
	}) => {
		const client = createWorkspaceClient(workspaceConfig);

		const { data: session, error } = await api.postSession({ client });
		if (error) {
			return ShErr({
				description: extractErrorMessage(error),
				title: 'Failed to create session',
			});
		}
		return Ok(session);
	},
});

// Mutation for deleting a session
export const deleteSession = defineMutation({
	mutationKey: ['deleteSession'],
	onSuccess: (_, { workspaceConfig }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspaceConfig.id, 'sessions'],
		});
	},
	resultMutationFn: async ({
		sessionId,
		workspaceConfig,
	}: {
		sessionId: string;
		workspaceConfig: WorkspaceConfig;
	}) => {
		const client = createWorkspaceClient(workspaceConfig);

		const { data, error } = await api.deleteSessionById({
			client,
			path: { id: sessionId },
		});
		if (error) {
			return ShErr({
				description: extractErrorMessage(error),
				title: 'Failed to delete session',
			});
		}
		return Ok(data);
	},
});

// Mutation for sharing a session
export const shareSession = defineMutation({
	mutationKey: ['shareSession'],
	onSuccess: (_, { workspaceConfig }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspaceConfig.id, 'sessions'],
		});
	},
	resultMutationFn: async ({
		sessionId,
		workspaceConfig,
	}: {
		sessionId: string;
		workspaceConfig: WorkspaceConfig;
	}) => {
		const client = createWorkspaceClient(workspaceConfig);

		const { data, error } = await api.postSessionByIdShare({
			client,
			path: { id: sessionId },
		});
		if (error) {
			return ShErr({
				description: extractErrorMessage(error),
				title: 'Failed to share session',
			});
		}
		return Ok(data);
	},
});

// Mutation for unsharing a session
export const unshareSession = defineMutation({
	mutationKey: ['unshareSession'],
	onSuccess: (_, { workspaceConfig }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspaceConfig.id, 'sessions'],
		});
	},
	resultMutationFn: async ({
		sessionId,
		workspaceConfig,
	}: {
		sessionId: string;
		workspaceConfig: WorkspaceConfig;
	}) => {
		const client = createWorkspaceClient(workspaceConfig);

		const { data, error } = await api.deleteSessionByIdShare({
			client,
			path: { id: sessionId },
		});
		if (error) {
			return ShErr({
				description: extractErrorMessage(error),
				title: 'Failed to unshare session',
			});
		}
		return Ok(data);
	},
});

// Mutation for aborting a session
export const abortSession = defineMutation({
	mutationKey: ['abortSession'],
	onSuccess: (_, { workspaceConfig }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspaceConfig.id, 'sessions'],
		});
	},
	resultMutationFn: async ({
		sessionId,
		workspaceConfig,
	}: {
		sessionId: string;
		workspaceConfig: WorkspaceConfig;
	}) => {
		const client = createWorkspaceClient(workspaceConfig);

		const { data, error } = await api.postSessionByIdAbort({
			client,
			path: { id: sessionId },
		});
		if (error) {
			return ShErr({
				description: extractErrorMessage(error),
				title: 'Failed to abort session',
			});
		}
		return Ok(data);
	},
});

// Mutation for initializing a session
export const initializeSession = defineMutation({
	mutationKey: ['initializeSession'],
	onSuccess: (_, { workspaceConfig }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspaceConfig.id, 'sessions'],
		});
	},
	resultMutationFn: async ({
		body,
		sessionId,
		workspaceConfig,
	}: {
		body?: { messageID: string; modelID: string; providerID: string };
		sessionId: string;
		workspaceConfig: WorkspaceConfig;
	}) => {
		const client = createWorkspaceClient(workspaceConfig);

		const { data, error } = await api.postSessionByIdInit({
			body,
			client,
			path: { id: sessionId },
		});
		if (error) {
			return ShErr({
				description: extractErrorMessage(error),
				title: 'Failed to initialize session',
			});
		}
		return Ok(data);
	},
});

// Mutation for summarizing a session
export const summarizeSession = defineMutation({
	mutationKey: ['summarizeSession'],
	onSuccess: (_, { workspaceConfig }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspaceConfig.id, 'sessions'],
		});
	},
	resultMutationFn: async ({
		body,
		sessionId,
		workspaceConfig,
	}: {
		body: PostSessionByIdSummarizeData['body'];
		sessionId: string;
		workspaceConfig: WorkspaceConfig;
	}) => {
		const client = createWorkspaceClient(workspaceConfig);

		const { data, error } = await api.postSessionByIdSummarize({
			body,
			client,
			path: { id: sessionId },
		});
		if (error) {
			return ShErr({
				description: extractErrorMessage(error),
				title: 'Failed to summarize session',
			});
		}
		return Ok(data);
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
					description: extractErrorMessage(error),
					title: 'Failed to fetch sessions',
				});
			}

			return Ok(data);
		},
		select: (sessions) => sessions?.find((s) => s.id === sessionId()),
	});

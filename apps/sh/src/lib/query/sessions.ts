import * as api from '$lib/client/sdk.gen';
import type {
	PostSessionByIdSummarizeData,
	PostSessionData,
	Session,
} from '$lib/client/types.gen';
import { createWorkspaceClient } from '$lib/client/workspace-client';
import { ShErr, type ShError } from '$lib/result';
import type { Workspace } from '$lib/stores/workspaces.svelte';
import type { Accessor, QueryObserverOptions } from '@tanstack/svelte-query';
import { extractErrorMessage } from 'wellcrafted/error';
import { Ok } from 'wellcrafted/result';
import { defineMutation, defineQuery, queryClient } from './_client';

// Query for fetching all sessions in a workspace
export const getSessions = (workspace: Accessor<Workspace>) =>
	defineQuery({
		queryKey: ['workspaces', workspace().id, 'sessions'],
		resultQueryFn: async () => {
			const client = createWorkspaceClient(workspace());

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
	resultMutationFn: async ({ workspace }: { workspace: Workspace }) => {
		const client = createWorkspaceClient(workspace);

		const { data: session, error } = await api.postSession({ client });
		if (error) {
			return ShErr({
				title: 'Failed to create session',
				description: extractErrorMessage(error),
			});
		}
		return Ok(session);
	},
	onSuccess: (_, { workspace }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspace.id, 'sessions'],
		});
	},
});

// Mutation for deleting a session
export const deleteSession = defineMutation({
	mutationKey: ['deleteSession'],
	resultMutationFn: async ({
		workspace,
		sessionId,
	}: {
		workspace: Workspace;
		sessionId: string;
	}) => {
		const client = createWorkspaceClient(workspace);

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
	onSuccess: (_, { workspace }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspace.id, 'sessions'],
		});
	},
});

// Mutation for sharing a session
export const shareSession = defineMutation({
	mutationKey: ['shareSession'],
	resultMutationFn: async ({
		workspace,
		id,
	}: {
		workspace: Workspace;
		id: string;
	}) => {
		const client = createWorkspaceClient(workspace);

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
	onSuccess: (_, { workspace }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspace.id, 'sessions'],
		});
	},
});

// Mutation for unsharing a session
export const unshareSession = defineMutation({
	mutationKey: ['unshareSession'],
	resultMutationFn: async ({
		workspace,
		id,
	}: {
		workspace: Workspace;
		id: string;
	}) => {
		const client = createWorkspaceClient(workspace);

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
	onSuccess: (_, { workspace }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspace.id, 'sessions'],
		});
	},
});

// Mutation for aborting a session
export const abortSession = defineMutation({
	mutationKey: ['abortSession'],
	resultMutationFn: async ({
		workspace,
		id,
	}: {
		workspace: Workspace;
		id: string;
	}) => {
		const client = createWorkspaceClient(workspace);

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
	onSuccess: (_, { workspace, id }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspace.id, 'sessions'],
		});
	},
});

// Mutation for initializing a session
export const initializeSession = defineMutation({
	mutationKey: ['initializeSession'],
	resultMutationFn: async ({
		workspace,
		id,
		body,
	}: {
		workspace: Workspace;
		id: string;
		body?: { providerID: string; modelID: string };
	}) => {
		const client = createWorkspaceClient(workspace);

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
	onSuccess: (_, { workspace }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspace.id, 'sessions'],
		});
	},
});

// Mutation for summarizing a session
export const summarizeSession = defineMutation({
	mutationKey: ['summarizeSession'],
	resultMutationFn: async ({
		workspace,
		sessionId,
		body,
	}: {
		workspace: Workspace;
		sessionId: string;
		body: PostSessionByIdSummarizeData['body'];
	}) => {
		const client = createWorkspaceClient(workspace);

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
	onSuccess: (_, { workspace }) => {
		queryClient.invalidateQueries({
			queryKey: ['workspaces', workspace.id, 'sessions'],
		});
	},
});

// Query for fetching a single session by ID
export const getSessionById = (
	workspace: Accessor<Workspace>,
	sessionId: Accessor<string>,
) =>
	defineQuery({
		queryKey: ['workspaces', workspace().id, 'sessions'],
		resultQueryFn: async () => {
			const client = createWorkspaceClient(workspace());

			const { data, error } = await api.getSession({ client });
			if (error) {
				return ShErr({
					title: 'Failed to fetch sessions',
					description: extractErrorMessage(error),
				});
			}

			return Ok(data);
		},
		select: (data) => {
			const session = data?.find((s) => s.id === sessionId());
			if (!session) {
				return ShErr({
					title: 'Session not found',
					description: 'The requested session does not exist',
				});
			}
			return Ok(session);
		},
	});

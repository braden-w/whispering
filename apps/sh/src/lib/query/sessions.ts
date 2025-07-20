import * as api from '$lib/client';
import type { PostSessionData } from '$lib/client/types.gen';
import { ShErr } from '$lib/result';
import type { Accessor } from '@tanstack/svelte-query';
import { extractErrorMessage } from 'wellcrafted/error';
import { Ok } from 'wellcrafted/result';
import { defineMutation, defineQuery, queryClient } from './_client';

// Query for fetching all sessions
export const getSessions = defineQuery({
	queryKey: ['sessions'],
	resultQueryFn: async () => {
		const { data, error } = await api.getSession();
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
	resultMutationFn: async (data?: PostSessionData) => {
		const { data: session, error } = await api.postSession(data);
		if (error) {
			return ShErr({
				title: 'Failed to create session',
				description: extractErrorMessage(error),
			});
		}
		return Ok(session);
	},
	onSuccess: () => {
		// Invalidate sessions list to refetch
		queryClient.invalidateQueries({ queryKey: ['sessions'] });
	},
});

// Mutation for deleting a session
export const deleteSession = defineMutation({
	mutationKey: ['deleteSession'],
	resultMutationFn: async ({ id }: { id: string }) => {
		const { data, error } = await api.deleteSessionById({ path: { id } });
		if (error) {
			return ShErr({
				title: 'Failed to delete session',
				description: extractErrorMessage(error),
			});
		}
		return Ok(data);
	},
	onSuccess: (_, { id }) => {
		// Invalidate both the sessions list and the specific session
		queryClient.invalidateQueries({ queryKey: ['sessions'] });
		queryClient.invalidateQueries({ queryKey: ['messages', id] });
	},
});

// Mutation for sharing a session
export const shareSession = defineMutation({
	mutationKey: ['shareSession'],
	resultMutationFn: async ({ id }: { id: string }) => {
		const { data, error } = await api.postSessionByIdShare({ path: { id } });
		if (error) {
			return ShErr({
				title: 'Failed to share session',
				description: extractErrorMessage(error),
			});
		}
		return Ok(data);
	},
	onSuccess: () => {
		// Invalidate the session to refetch with share URL
		queryClient.invalidateQueries({ queryKey: ['sessions'] });
	},
});

// Mutation for unsharing a session
export const unshareSession = defineMutation({
	mutationKey: ['unshareSession'],
	resultMutationFn: async ({ id }: { id: string }) => {
		const { data, error } = await api.deleteSessionByIdShare({ path: { id } });
		if (error) {
			return ShErr({
				title: 'Failed to unshare session',
				description: extractErrorMessage(error),
			});
		}
		return Ok(data);
	},
	onSuccess: () => {
		// Invalidate the session to refetch without share URL
		queryClient.invalidateQueries({ queryKey: ['sessions'] });
	},
});

// Mutation for aborting a session
export const abortSession = defineMutation({
	mutationKey: ['abortSession'],
	resultMutationFn: async ({ id }: { id: string }) => {
		const { data, error } = await api.postSessionByIdAbort({ path: { id } });
		if (error) {
			return ShErr({
				title: 'Failed to abort session',
				description: extractErrorMessage(error),
			});
		}
		return Ok(data);
	},
	onSuccess: (_, { id }) => {
		// Invalidate the session and messages
		queryClient.invalidateQueries({ queryKey: ['sessions'] });
		queryClient.invalidateQueries({ queryKey: ['messages', id] });
	},
});

// Mutation for initializing a session
export const initializeSession = defineMutation({
	mutationKey: ['initializeSession'],
	resultMutationFn: async ({ id }: { id: string }) => {
		const { data, error } = await api.postSessionByIdInit({ path: { id } });
		if (error) {
			return ShErr({
				title: 'Failed to initialize session',
				description: extractErrorMessage(error),
			});
		}
		return Ok(data);
	},
	onSuccess: (_, { id }) => {
		queryClient.invalidateQueries({ queryKey: ['sessions', id] });
	},
});

// Mutation for summarizing a session
export const summarizeSession = defineMutation({
	mutationKey: ['summarizeSession'],
	resultMutationFn: async ({ id }: { id: string }) => {
		const { data, error } = await api.postSessionByIdSummarize({
			path: { id },
		});
		if (error) {
			return ShErr({
				title: 'Failed to summarize session',
				description: extractErrorMessage(error),
			});
		}
		return Ok(data);
	},
	onSuccess: (_, { id }) => {
		queryClient.invalidateQueries({ queryKey: ['messages', id] });
	},
});

// Query for fetching a single session by ID
export const getSessionById = (sessionId: Accessor<string> | string) =>
	defineQuery({
		queryKey: () => [
			'sessions',
			typeof sessionId === 'function' ? sessionId() : sessionId,
		],
		resultQueryFn: async () => {
			const id = typeof sessionId === 'function' ? sessionId() : sessionId;
			const { data, error } = await api.getSessionById({ path: { id } });
			if (error) {
				return ShErr({
					title: 'Failed to fetch session',
					description: extractErrorMessage(error),
				});
			}
			return Ok(data);
		},
	});

import * as api from '$lib/client/sdk.gen';
import { createWorkspaceClient } from '$lib/client/workspace-client';
import {
	workspaces,
	type WorkspaceConfig,
} from '$lib/stores/workspaces.svelte';
import { Ok } from 'wellcrafted/result';
import { defineQuery, queryClient } from './_client';
import type { Accessor } from '@tanstack/svelte-query';
import type { App } from '$lib/client/types.gen';

/**
 * A workspace config merged with information fetched from the OpenCode server.
 *
 * Combines:
 * 1. Your saved workspace config (stored locally in the app)
 * 2. Live connection status and OpenCode app info from the server
 *
 * If connected=true, includes the OpenCode app info. If connected=false, server is unreachable.
 */
export type Workspace = WorkspaceConfig &
	({ connected: true; appInfo: App } | { connected: false });

/**
 * Gets all workspaces by merging their configs with OpenCode app info.
 *
 * Checks all saved workspaces in parallel for speed.
 *
 * @returns All workspaces with connection status and app info if connected
 */
export const getWorkspaces = () =>
	defineQuery({
		queryKey: ['workspaces'],
		resultQueryFn: async (): Promise<Ok<Workspace[]>> => {
			const workspacePromises = workspaces.value.map(
				async (config): Promise<Workspace> => {
					const client = createWorkspaceClient(config);

					const { data, error } = await api.getApp({ client });

					if (data && !error) {
						return { ...config, connected: true, appInfo: data };
					}

					return { ...config, connected: false };
				},
			);

			const enhancedWorkspaces = await Promise.all(workspacePromises);
			return Ok(enhancedWorkspaces);
		},
		// Start with workspaces marked as disconnected
		initialData: workspaces.value.map((w) => ({
			...w,
			connected: false,
		})),
		// Only refetch if workspaces exist
		enabled: workspaces.value.length > 0,
	});

/**
 * Gets a workspace by merging its config with OpenCode app info.
 *
 * @param config - The workspace config to check
 * @returns The workspace with connection status and app info if connected
 */
export const getWorkspace = (config: Accessor<WorkspaceConfig>) =>
	defineQuery({
		queryKey: ['workspace', config().id],
		resultQueryFn: async (): Promise<Ok<Workspace>> => {
			const client = createWorkspaceClient(config());

			const { data, error } = await api.getApp({ client });

			if (data && !error) {
				return Ok({ ...config(), connected: true, appInfo: data });
			}

			return Ok({ ...config(), connected: false });
		},
		initialData: queryClient
			.getQueryData<Workspace[]>(['workspaces'])
			?.find((w) => w.id === config().id),
		initialDataUpdatedAt: () =>
			queryClient.getQueryState<Workspace[]>(['workspaces'])?.dataUpdatedAt,
	});

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
 * A workspace configuration merged with live OpenCode app information.
 *
 * This type represents the result of attempting to connect to a workspace's OpenCode server:
 * - If the connection succeeds (connected=true): includes the full OpenCode app info
 * - If the connection fails (connected=false): workspace is unreachable
 * - Always includes checkedAt: timestamp of when we last checked the connection
 *
 * Used in the UI to show users which workspaces are currently online and available.
 */
export type Workspace = WorkspaceConfig & {
	checkedAt: number; // Unix timestamp of last connection check
} & ({ connected: true; appInfo: App } | { connected: false });

/**
 * Fetches all workspace configs and attempts to merge them with live OpenCode app information.
 *
 * For each workspace config:
 * - Attempts to connect to its OpenCode server using the workspace URL
 * - If connection succeeds: marks connected=true and includes the OpenCode app info
 * - If connection fails: marks connected=false (workspace unreachable)
 *
 * Checks all workspaces in parallel for optimal performance.
 * Used in the UI to display which workspaces are online vs offline.
 *
 * @returns Array of workspaces with their connection status and app info (if connected)
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
						return {
							...config,
							checkedAt: Date.now(),
							connected: true,
							appInfo: data,
						};
					}

					return {
						...config,
						checkedAt: Date.now(),
						connected: false,
					};
				},
			);

			const enhancedWorkspaces = await Promise.all(workspacePromises);
			return Ok(enhancedWorkspaces);
		},
		// Only refetch if workspaces exist
		enabled: workspaces.value.length > 0,
	});

/**
 * Fetches a single workspace config and attempts to merge it with live OpenCode app information.
 *
 * Takes a workspace config and:
 * - Attempts to connect to its OpenCode server using the workspace URL
 * - If connection succeeds: marks connected=true and includes the OpenCode app info
 * - If connection fails: marks connected=false (workspace unreachable)
 *
 * Used in the UI to show whether a specific workspace is online and available.
 *
 * @param config - The workspace configuration to check connection status for
 * @returns The workspace with connection status and app info (if connected)
 */
export const getWorkspace = (config: Accessor<WorkspaceConfig>) =>
	defineQuery({
		queryKey: ['workspace', config().id],
		resultQueryFn: async (): Promise<Ok<Workspace>> => {
			const client = createWorkspaceClient(config());

			const { data, error } = await api.getApp({ client });

			if (data && !error) {
				return Ok({
					...config(),
					checkedAt: Date.now(),
					connected: true,
					appInfo: data,
				});
			}

			return Ok({
				...config(),
				checkedAt: Date.now(),
				connected: false,
			});
		},
		initialData: queryClient
			.getQueryData<Workspace[]>(['workspaces'])
			?.find((w) => w.id === config().id),
		initialDataUpdatedAt: () =>
			queryClient.getQueryState<Workspace[]>(['workspaces'])?.dataUpdatedAt,
	});

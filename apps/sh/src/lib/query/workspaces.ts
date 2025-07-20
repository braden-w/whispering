import * as api from '$lib/client/sdk.gen';
import { createWorkspaceClient } from '$lib/client/workspace-client';
import { workspaces, type Workspace } from '$lib/stores/workspaces.svelte';
import { Ok } from 'wellcrafted/result';
import { defineQuery } from './_client';
import type { Accessor } from '@tanstack/svelte-query';
import type { App } from '$lib/client/types.gen';

/**
 * Workspace enhanced with connection metadata fetched from the opencode server.
 * Uses a discriminated union to ensure type safety between connection states.
 *
 * When connected is true, appInfo will be present.
 * When connected is false, appInfo will not exist.
 */
export type WorkspaceWithMetadata = Workspace &
	({ connected: true; appInfo: App } | { connected: false });

/**
 * Query to enhance a single workspace with connection metadata.
 * Returns the workspace with additional connection status and app info.
 */
export const getWorkspaceWithConnection = (workspace: Accessor<Workspace>) =>
	defineQuery({
		queryKey: ['workspace-enhanced', workspace().id],
		resultQueryFn: async (): Promise<Ok<WorkspaceWithMetadata>> => {
			const client = createWorkspaceClient(workspace());

			const { data, error } = await api.getApp({ client });

			if (data && !error) {
				return Ok({ ...workspace(), connected: true, appInfo: data });
			}

			return Ok({ ...workspace(), connected: false });
		},
		// Start with the workspace marked as disconnected
		initialData: { ...workspace(), connected: false },
	});

/**
 * Query to enhance multiple workspaces with connection metadata.
 * Returns an array of workspaces with additional connection status and app info.
 */
export const getWorkspacesWithConnections = () =>
	defineQuery({
		queryKey: ['workspaces-enhanced'],
		resultQueryFn: async (): Promise<Ok<WorkspaceWithMetadata[]>> => {
			const enhancedWorkspacePromises = workspaces.value.map(
				async (workspace): Promise<WorkspaceWithMetadata> => {
					const client = createWorkspaceClient(workspace);

					const { data, error } = await api.getApp({ client });

					if (data && !error) {
						return { ...workspace, connected: true, appInfo: data };
					}

					return { ...workspace, connected: false };
				},
			);

			const enhancedWorkspaces = await Promise.all(enhancedWorkspacePromises);
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

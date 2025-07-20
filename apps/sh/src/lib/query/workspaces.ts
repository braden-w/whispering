import * as api from '$lib/client/sdk.gen';
import { createWorkspaceClient } from '$lib/client/workspace-client';
import { ShErr } from '$lib/result';
import type { Workspace } from '$lib/stores/workspaces.svelte';
import { extractErrorMessage } from 'wellcrafted/error';
import { Ok } from 'wellcrafted/result';
import { defineQuery } from './_client';

// Query for checking a single workspace connection status
export const checkWorkspaceConnection = (workspace: Workspace) =>
	defineQuery({
		queryKey: ['workspace-connection', workspace.id],
		resultQueryFn: async () => {
			const client = createWorkspaceClient(workspace);

			try {
				const { data, error } = await api.getApp({ client });

				if (error) {
					return Ok({ connected: false, workspace });
				}

				return Ok({ connected: true, workspace, appInfo: data });
			} catch (err) {
				// Network errors, timeouts, etc.
				return Ok({ connected: false, workspace });
			}
		},
		// Refetch every 30 seconds to keep status updated
		refetchInterval: 30000,
		// Refetch when window regains focus
		refetchOnWindowFocus: true,
	});

// Query for checking all workspaces connection status at once
export const checkAllWorkspaceConnections = (workspaces: Workspace[]) =>
	defineQuery({
		queryKey: ['workspace-connections', workspaces.map((w) => w.id).sort()],
		resultQueryFn: async () => {
			const connectionPromises = workspaces.map(async (workspace) => {
				const client = createWorkspaceClient(workspace);

				const { data, error } = await api.getApp({ client });

				return {
					workspaceId: workspace.id,
					connected: !!data && !error,
					appInfo: data,
				};
			});

			const results = await Promise.all(connectionPromises);

			// Convert to a map for easy lookup
			const connectionMap = results.reduce(
				(acc, result) => {
					acc[result.workspaceId] = {
						connected: result.connected,
						appInfo: result.appInfo,
					};
					return acc;
				},
				{} as Record<string, { connected: boolean; appInfo: any }>,
			);

			return Ok(connectionMap);
		},
		// Refetch every 30 seconds
		refetchInterval: 30000,
		// Refetch when window regains focus
		refetchOnWindowFocus: true,
		// Only refetch if workspaces have changed
		enabled: workspaces.length > 0,
	});

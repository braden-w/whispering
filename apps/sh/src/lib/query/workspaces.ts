import type { App } from '$lib/client/types.gen';
import type { Accessor } from '@tanstack/svelte-query';

import { createWorkspaceClient } from '$lib/client/client.gen';
import * as api from '$lib/client/sdk.gen';
import {
	type Password,
	type Port,
	type URL,
	type WorkspaceConfig,
	workspaceConfigs,
} from '$lib/stores/workspace-configs.svelte';
import { Err, Ok } from 'wellcrafted/result';

import { defineQuery, queryClient } from './_client';

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
export type Workspace = WorkspaceConfig &
	({ appInfo: App; connected: true } | { connected: false }) & {
		checkedAt: number; // Unix timestamp of last connection check
	};

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
					appInfo: data,
					checkedAt: Date.now(),
					connected: true,
				});
			}

			return Ok({
				...config(),
				checkedAt: Date.now(),
				connected: false,
			});
		},
		// TanStack Query default behavior:
		// - retry: 3 (retries failed queries 3 times with exponential backoff)
		// - retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
		//   This means: 1s, 2s, 4s, 8s... up to 30s between retries
		//
		// Why we override to retry: 0:
		// - Retrying won't fix a non-existent domain or closed tunnel
		// - Each retry generates console errors, creating noise
		retry: 0,

		// TanStack Query default: retryOnMount: true
		// This means when a component remounts, it retries failed queries
		// We set retryOnMount: false to prevent retry spam when navigating between pages
		retryOnMount: false,
	});

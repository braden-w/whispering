import * as api from '$lib/client/sdk.gen';
import { createWorkspaceClient } from '$lib/client/client.gen';
import { ShErr } from '$lib/result';
import type { WorkspaceConfig } from '$lib/stores/workspace-configs.svelte';
import type { Accessor } from '@tanstack/svelte-query';
import { extractErrorMessage } from 'wellcrafted/error';
import { Ok } from 'wellcrafted/result';
import { defineQuery } from './_client';

// Query for fetching available modes
export const getModes = (workspace: Accessor<WorkspaceConfig>) =>
	defineQuery({
		queryKey: ['workspaces', workspace().id, 'modes'],
		resultQueryFn: async () => {
			const client = createWorkspaceClient(workspace());

			const { data, error } = await api.getMode({ client });
			if (error) {
				return ShErr({
					title: 'Failed to fetch modes',
					description: extractErrorMessage(error),
				});
			}

			return Ok(data);
		},
	});

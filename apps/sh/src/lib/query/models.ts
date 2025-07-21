import type { WorkspaceConfig } from '$lib/stores/workspace-configs.svelte';
import type { Accessor } from '@tanstack/svelte-query';

import { createWorkspaceClient } from '$lib/client/client.gen';
import * as api from '$lib/client/sdk.gen';
import { ShErr } from '$lib/result';
import { extractErrorMessage } from 'wellcrafted/error';
import { Ok } from 'wellcrafted/result';

import { defineQuery } from './_client';

// Query for fetching all providers and models
export const getProviders = (workspace: Accessor<WorkspaceConfig>) =>
	defineQuery({
		queryKey: ['workspaces', workspace().id, 'providers'],
		resultQueryFn: async () => {
			const client = createWorkspaceClient(workspace());

			const { data, error } = await api.getConfigProviders({ client });
			if (error) {
				return ShErr({
					description: extractErrorMessage(error),
					title: 'Failed to fetch providers',
				});
			}

			return Ok(data);
		},
	});

import * as api from '$lib/client/sdk.gen';
import { createWorkspaceClient } from '$lib/client/workspace-client';
import { ShErr } from '$lib/result';
import type { Workspace } from '$lib/stores/workspaces.svelte';
import type { Accessor } from '@tanstack/svelte-query';
import { extractErrorMessage } from 'wellcrafted/error';
import { Ok } from 'wellcrafted/result';
import { defineQuery } from './_client';

// Query for fetching all providers and models
export const getProviders = (workspace: Accessor<Workspace>) =>
	defineQuery({
		queryKey: ['workspaces', workspace().id, 'providers'],
		resultQueryFn: async () => {
			const client = createWorkspaceClient(workspace());

			const { data, error } = await api.getConfigProviders({ client });
			if (error) {
				return ShErr({
					title: 'Failed to fetch providers',
					description: extractErrorMessage(error),
				});
			}

			return Ok(data);
		},
	});

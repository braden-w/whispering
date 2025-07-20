import * as api from '$lib/client/sdk.gen';
import type { UserMessagePart } from '$lib/client/types.gen';
import { createWorkspaceClient } from '$lib/client/workspace-client';
import { ShErr } from '$lib/result';
import type { Workspace } from '$lib/stores/workspaces.svelte';
import { extractErrorMessage } from 'wellcrafted/error';
import { Ok } from 'wellcrafted/result';
import { defineMutation } from './_client';

// Mutation for sending a message
export const sendMessage = defineMutation({
	mutationKey: ['sendMessage'],
	resultMutationFn: async ({ 
		workspace, 
		sessionId, 
		mode = 'chat',
		parts 
	}: { 
		workspace: Workspace; 
		sessionId: string;
		mode?: string;
		parts: UserMessagePart[];
	}) => {
		const client = createWorkspaceClient(workspace);
		
		// TODO: Provider and model should come from workspace settings or user preferences
		// For now, we'll use default values
		const { data, error } = await api.postSessionByIdMessage({
			client,
			path: { id: sessionId },
			body: { 
				providerID: 'openai',
				modelID: 'gpt-4o-mini',
				mode,
				parts 
			}
		});
		
		if (error) {
			return ShErr({
				title: 'Failed to send message',
				description: extractErrorMessage(error)
			});
		}
		return Ok(data);
	}
});

// Re-export the helper functions from messages.svelte.ts
export { isMessageProcessing, isSessionProcessing } from '$lib/stores/messages.svelte';
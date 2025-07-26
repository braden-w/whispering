import { goto } from '$app/navigation';
import { type } from 'arktype';
import { toast } from 'svelte-sonner';
import {
	workspaceConfigs,
	CreateWorkspaceParams,
} from '$lib/stores/workspace-configs.svelte';
import { FLASH_MESSAGE_PARAMS, FlashMessage } from './redirects';

/**
 * Hook that monitors URL parameters for flash messages, displays them as toasts,
 * and cleans them from the URL to prevent re-displaying on page refresh.
 *
 * This hook should be called in components that are redirect targets (e.g., homepage, workspaces).
 * It automatically:
 * 1. Checks for flash message parameters on URL changes
 * 2. Validates the message structure
 * 3. Displays the message as a toast with the appropriate type (error, success, info, warning)
 * 4. Removes the parameters from the URL without navigation
 *
 * @param url - The reactive URL object from $page.url
 *
 * @example
 * ```svelte
 * import { page } from '$app/state';
 * import { useFlashMessage } from '$lib/utils/search-params.svelte';
 *
 * useFlashMessage(page.url);
 * ```
 */
export function useFlashMessage(url: URL) {
	$effect(() => {
		const validated = FlashMessage({
			title: url.searchParams.get(FLASH_MESSAGE_PARAMS.title),
			description: url.searchParams.get(FLASH_MESSAGE_PARAMS.description),
			type: url.searchParams.get(FLASH_MESSAGE_PARAMS.type),
		});
		if (validated instanceof type.errors) return;

		toast[validated.type](validated.title, {
			description: validated.description,
		});

		const cleanUrl = new URL(url);
		cleanUrl.searchParams.delete(FLASH_MESSAGE_PARAMS.title);
		cleanUrl.searchParams.delete(FLASH_MESSAGE_PARAMS.description);
		cleanUrl.searchParams.delete(FLASH_MESSAGE_PARAMS.type);

		goto(`${cleanUrl.pathname}${cleanUrl.search}`, {
			replaceState: true,
			noScroll: true,
		});
	});
}

/**
 * Hook that monitors URL parameters for workspace creation data,
 * creates the workspace if valid parameters are found, and cleans the URL.
 *
 * This hook enables deep linking for workspace creation, allowing users to share
 * pre-configured workspace links that automatically create workspaces on load.
 *
 * @param url - The reactive URL object from $page.url
 *
 * @example
 * ```svelte
 * import { page } from '$app/state';
 * import { useCreateWorkspaceParams } from '$lib/utils/search-params.svelte';
 *
 * useCreateWorkspaceParams(page.url);
 * ```
 */
export const useCreateWorkspaceParams = (url: URL) => {
	/**
	 * URL search parameter constants for workspace creation
	 */
	const WORKSPACE_CREATE_PARAMS = {
		name: 'name',
		url: 'url',
		port: 'port',
		password: 'password',
	} as const;

	$effect(() => {
		const port = url.searchParams.get(WORKSPACE_CREATE_PARAMS.port);
		const workspaceUrl = url.searchParams.get(WORKSPACE_CREATE_PARAMS.url);
		const password = url.searchParams.get(WORKSPACE_CREATE_PARAMS.password);
		const name = url.searchParams.get(WORKSPACE_CREATE_PARAMS.name);

		const workspace = CreateWorkspaceParams({
			name,
			password,
			port: port ? Number.parseInt(port, 10) : null,
			url: workspaceUrl,
		});
		if (workspace instanceof type.errors) return;
		workspaceConfigs.create(workspace);

		// Clean URL without navigation by replacing the current history entry
		const cleanUrl = new URL(url);
		cleanUrl.searchParams.delete(WORKSPACE_CREATE_PARAMS.port);
		cleanUrl.searchParams.delete(WORKSPACE_CREATE_PARAMS.url);
		cleanUrl.searchParams.delete(WORKSPACE_CREATE_PARAMS.password);
		cleanUrl.searchParams.delete(WORKSPACE_CREATE_PARAMS.name);

		goto(`${cleanUrl.pathname}${cleanUrl.search}`, {
			replaceState: true,
			noScroll: true,
		});
	});
};

import { goto } from '$app/navigation';
import {
	assistantConfigs,
	CreateAssistantParams,
} from '$lib/stores/assistant-configs.svelte';
import { type } from 'arktype';
import { untrack } from 'svelte';
import { toast } from 'svelte-sonner';

import {
	FLASH_MESSAGE_PARAMS,
	FlashMessage,
} from './redirect-with-flash-message';

/**
 * Hook that monitors URL parameters for flash messages, displays them as toasts,
 * and cleans them from the URL to prevent re-displaying on page refresh.
 *
 * This hook should be called in components that are redirect targets (e.g., homepage, assistants).
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
			noScroll: true,
			replaceState: true,
		});
	});
}

/**
 * Hook that monitors URL parameters for assistant creation data,
 * creates the assistant if valid parameters are found, and cleans the URL.
 *
 * This hook enables deep linking for assistant creation, allowing users to share
 * pre-configured assistant links that automatically create assistants on load.
 *
 * @param url - The reactive URL object from $page.url
 *
 * @example
 * ```svelte
 * import { page } from '$app/state';
 * import { useCreateAssistantParams } from '$lib/utils/search-params.svelte';
 *
 * useCreateAssistantParams(page.url);
 * ```
 */
export const useCreateAssistantParams = (url: URL) => {
	/**
	 * URL search parameter constants for assistant creation
	 */
	const ASSISTANT_CREATE_PARAMS = {
		name: 'name',
		password: 'password',
		port: 'port',
		url: 'url',
	} as const;

	$effect(() => {
		const port = url.searchParams.get(ASSISTANT_CREATE_PARAMS.port);
		const assistantUrl = url.searchParams.get(ASSISTANT_CREATE_PARAMS.url);
		const password = url.searchParams.get(ASSISTANT_CREATE_PARAMS.password);
		const name = url.searchParams.get(ASSISTANT_CREATE_PARAMS.name);

		const assistant = CreateAssistantParams({
			name,
			password,
			port: port ? Number.parseInt(port, 10) : null,
			url: assistantUrl,
		});
		if (assistant instanceof type.errors) return;
		untrack(() => assistantConfigs.create(assistant));

		// Clean URL without navigation by replacing the current history entry
		const cleanUrl = new URL(url);
		cleanUrl.searchParams.delete(ASSISTANT_CREATE_PARAMS.port);
		cleanUrl.searchParams.delete(ASSISTANT_CREATE_PARAMS.url);
		cleanUrl.searchParams.delete(ASSISTANT_CREATE_PARAMS.password);
		cleanUrl.searchParams.delete(ASSISTANT_CREATE_PARAMS.name);

		goto(`${cleanUrl.pathname}${cleanUrl.search}`, {
			noScroll: true,
			replaceState: true,
		});
	});
};

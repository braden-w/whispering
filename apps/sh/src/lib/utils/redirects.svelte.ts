import { goto } from '$app/navigation';
import { APPS } from '@repo/constants';
import { redirect } from '@sveltejs/kit';
import { type } from 'arktype';
import { toast } from 'svelte-sonner';

const FLASH_MESSAGE_PARAMS = {
	title: 'flash_title',
	description: 'flash_description',
	type: 'flash_type', // 'error' | 'success' | 'info' | 'warning'
} as const;

const FlashMessage = type({
	title: 'string',
	description: 'string',
	type: "'error' | 'success' | 'info' | 'warning'",
});

type FlashMessage = typeof FlashMessage.infer;

/**
 * Internal helper that wraps SvelteKit's redirect with flash message support
 */
function redirectWithFlash(
	status: number,
	location: `/${string}`,
	message: FlashMessage,
): never {
	// Encode message as URL parameters
	const url = new URL(location, import.meta.env.BASE_URL);
	url.searchParams.set(FLASH_MESSAGE_PARAMS.title, message.title);
	url.searchParams.set(FLASH_MESSAGE_PARAMS.description, message.description);
	if (message.type) {
		url.searchParams.set(FLASH_MESSAGE_PARAMS.type, message.type);
	}

	return redirect(status, url.pathname + url.search);
}

/**
 * Redirect to homepage with an error flash message
 */
export function redirectToHomepageWithError(
	message: Omit<FlashMessage, 'type'>,
): never {
	return redirectWithFlash(302, '/', { ...message, type: 'error' });
}

/**
 * Redirect to workspaces page with an error flash message
 */
export function redirectToWorkspacesWithError(
	message: Omit<FlashMessage, 'type'>,
): never {
	return redirectWithFlash(302, '/workspaces', { ...message, type: 'error' });
}

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
 * import { useFlashMessage } from '$lib/utils/redirects.svelte';
 *
 * useFlashMessage(page.url);
 * ```
 */
export const useFlashMessage = (url: URL) =>
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

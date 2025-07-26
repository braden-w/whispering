import { redirect } from '@sveltejs/kit';
import { type } from 'arktype';

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

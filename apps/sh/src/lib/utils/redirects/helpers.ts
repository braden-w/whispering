import { redirect } from '@sveltejs/kit';
import { FLASH_MESSAGE_PARAMS, type FlashMessage } from './types';

/**
 * Internal helper that wraps SvelteKit's redirect with flash message support
 */
export function redirectWithFlash(
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
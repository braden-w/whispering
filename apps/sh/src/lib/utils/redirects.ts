import { APPS } from '@repo/constants';
import { redirect } from '@sveltejs/kit';
import { toast } from 'svelte-sonner';

const REDIRECT_MESSAGE_PARAMS = {
	title: 'redirect_title',
	description: 'redirect_description',
} as const;

/**
 * Redirect message type - currently only supports error type
 */
type RedirectMessage = { title: string; description: string };

/**
 * Internal helper that wraps SvelteKit's redirect with message support
 */
function redirectWithMessage(
	status: number,
	location: `/${string}`,
	message: RedirectMessage,
): never {
	// Encode message as URL parameters
	const url = new URL(location, import.meta.env.BASE_URL);
	url.searchParams.set(REDIRECT_MESSAGE_PARAMS.title, message.title);
	url.searchParams.set(
		REDIRECT_MESSAGE_PARAMS.description,
		message.description,
	);

	return redirect(status, url.pathname + url.search);
}

/**
 * Redirect to homepage with an error message
 */
export function redirectToHomepageWithError(
	title: string,
	description: string,
): never {
	return redirectWithMessage(302, '/', {
		title,
		description,
	});
}

/**
 * Redirect to workspaces page with an error message
 */
export function redirectToWorkspacesWithError(
	title: string,
	description: string,
): never {
	return redirectWithMessage(302, '/workspaces', {
		title,
		description,
	});
}

/**
 * Extract redirect message from URL search parameters
 * Use this in page load functions to get the message
 */
export function extractRedirectMessage(url: URL): RedirectMessage | null {
	const title = url.searchParams.get(REDIRECT_MESSAGE_PARAMS.title);
	const description = url.searchParams.get(REDIRECT_MESSAGE_PARAMS.description);

	if (!title || !description) return null;

	return { title, description };
}

/**
 * Show a redirect message as a toast
 * Use this in components on mount to display the message
 */
export function showRedirectToast(message: RedirectMessage): void {
	toast.error(message.title, { description: message.description });
}

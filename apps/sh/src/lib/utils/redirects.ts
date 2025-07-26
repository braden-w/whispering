import { redirect } from '@sveltejs/kit';
import { toast } from 'svelte-sonner';

/**
 * Redirect message type - currently only supports error type
 */
export type RedirectMessage = {
	type: 'error';
	title: string;
	description?: string;
};

/**
 * Internal helper that wraps SvelteKit's redirect with message support
 */
function redirectWithMessage(
	status: number,
	location: string,
	message?: RedirectMessage,
): never {
	if (!message) {
		return redirect(status, location);
	}

	// Encode message as URL parameters
	const url = new URL(location, 'http://localhost'); // Base URL doesn't matter for relative paths
	url.searchParams.set('redirect_type', message.type);
	url.searchParams.set('redirect_title', message.title);
	if (message.description) {
		url.searchParams.set('redirect_description', message.description);
	}

	return redirect(status, url.pathname + url.search);
}

/**
 * Redirect to homepage with an error message
 */
export function redirectToHomepageWithError(
	title: string,
	description?: string,
): never {
	return redirectWithMessage(302, '/', {
		type: 'error',
		title,
		description,
	});
}

/**
 * Redirect to workspaces page with an error message
 */
export function redirectToWorkspacesWithError(
	title: string,
	description?: string,
): never {
	return redirectWithMessage(302, '/workspaces', {
		type: 'error',
		title,
		description,
	});
}

/**
 * Extract redirect message from URL search parameters
 * Use this in page load functions to get the message
 */
export function extractRedirectMessage(url: URL): RedirectMessage | null {
	const type = url.searchParams.get('redirect_type');
	const title = url.searchParams.get('redirect_title');

	if (!type || !title || type !== 'error') {
		return null;
	}

	const description = url.searchParams.get('redirect_description') || undefined;

	return {
		type: 'error',
		title,
		description,
	};
}

/**
 * Show a redirect message as a toast
 * Use this in components on mount to display the message
 */
export function showRedirectToast(message: RedirectMessage): void {
	// Currently only supports error type
	toast.error(
		message.title,
		message.description ? { description: message.description } : undefined,
	);
}

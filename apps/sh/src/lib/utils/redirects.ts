import { APPS } from '@repo/constants';
import { redirect } from '@sveltejs/kit';
import { type } from 'arktype';
import { toast } from 'svelte-sonner';

const REDIRECT_MESSAGE_PARAMS = {
	title: 'redirect_title',
	description: 'redirect_description',
} as const;

const RedirectMessage = type({
	title: 'string',
	description: 'string',
});

type RedirectMessage = typeof RedirectMessage.infer;

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
export function redirectToHomepageWithError(message: RedirectMessage): never {
	return redirectWithMessage(302, '/', message);
}

/**
 * Redirect to workspaces page with an error message
 */
export function redirectToWorkspacesWithError(message: RedirectMessage): never {
	return redirectWithMessage(302, '/workspaces', message);
}

export function useShowRedirectToastIfParamsPresent(url: URL) {
	const title = url.searchParams.get(REDIRECT_MESSAGE_PARAMS.title);
	const description = url.searchParams.get(REDIRECT_MESSAGE_PARAMS.description);

	const validated = RedirectMessage({ title, description });
	if (validated instanceof type.errors) return;

	toast.error(validated.title, { description: validated.description });

	url.searchParams.delete(REDIRECT_MESSAGE_PARAMS.title);
	url.searchParams.delete(REDIRECT_MESSAGE_PARAMS.description);
}

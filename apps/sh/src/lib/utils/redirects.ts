import { redirect } from '@sveltejs/kit';
import { type } from 'arktype';

/**
 * Flash message schema for validation
 */
export const FlashMessage = type({
	title: 'string',
	description: 'string',
	type: "'error' | 'success' | 'info' | 'warning'",
});

type FlashMessage = typeof FlashMessage.infer;

/**
 * URL parameter names for flash messages
 */
export const FLASH_MESSAGE_PARAMS = {
	title: 'flash_title',
	description: 'flash_description',
	type: 'flash_type',
} as const;

/**
 * Internal helper that wraps SvelteKit's redirect with flash message support
 * @internal
 */
function redirectWithFlash(
	status: number,
	location: `/${string}`,
	message: FlashMessage,
): never {
	const url = new URL(location, import.meta.env.BASE_URL);
	url.searchParams.set(FLASH_MESSAGE_PARAMS.title, message.title);
	url.searchParams.set(FLASH_MESSAGE_PARAMS.description, message.description);
	url.searchParams.set(FLASH_MESSAGE_PARAMS.type, message.type);
	return redirect(status, url.pathname + url.search);
}

/**
 * Creates an object with error, info, success, and warning redirect methods
 * @internal
 */
function createRedirectMethods(location: `/${string}`) {
	return {
		/**
		 * Redirect with an error message
		 * @param message - The error message to display
		 * @returns Never - this function always throws a redirect
		 */
		error(message: Omit<FlashMessage, 'type'>): never {
			return redirectWithFlash(302, location, { ...message, type: 'error' });
		},

		/**
		 * Redirect with an informational message
		 * @param message - The info message to display
		 * @returns Never - this function always throws a redirect
		 */
		info(message: Omit<FlashMessage, 'type'>): never {
			return redirectWithFlash(302, location, { ...message, type: 'info' });
		},

		/**
		 * Redirect with a success message
		 * @param message - The success message to display
		 * @returns Never - this function always throws a redirect
		 */
		success(message: Omit<FlashMessage, 'type'>): never {
			return redirectWithFlash(302, location, { ...message, type: 'success' });
		},

		/**
		 * Redirect with a warning message
		 * @param message - The warning message to display
		 * @returns Never - this function always throws a redirect
		 */
		warning(message: Omit<FlashMessage, 'type'>): never {
			return redirectWithFlash(302, location, { ...message, type: 'warning' });
		},
	};
}

/**
 * Homepage redirect methods with flash message support
 * @example
 * ```typescript
 * if (!authorized) {
 *   redirectTo.homepage.error({
 *     title: 'Access Denied',
 *     description: 'You do not have permission to view this page'
 *   });
 *   return;
 * }
 * ```
 */
const homepage = createRedirectMethods('/');

/**
 * Workspaces list redirect methods with flash message support
 * @example
 * ```typescript
 * if (!workspaceConfig) {
 *   redirectTo.workspaces.error({
 *     title: 'Workspace Not Found',
 *     description: 'The workspace you requested does not exist'
 *   });
 *   return;
 * }
 * ```
 */
const workspaces = createRedirectMethods('/workspaces');

/**
 * Creates redirect methods for a specific workspace
 * @param workspaceId - The ID of the workspace to redirect to
 * @returns An object with redirect methods for different message types
 * @example
 * ```typescript
 * // Chained method pattern
 * if (sessionError) {
 *   redirectTo.workspace(params.id).error(sessionError);
 *   return;
 * }
 *
 * // With custom message
 * if (!session) {
 *   redirectTo.workspace(params.id).info({
 *     title: 'Session Not Found',
 *     description: 'The requested session does not exist'
 *   });
 *   return;
 * }
 * ```
 */
function workspace(workspaceId: string) {
	return createRedirectMethods(`/workspaces/${workspaceId}` as const);
}

/**
 * Unified redirect API with flash message support.
 *
 * Provides a consistent interface for redirecting to different parts of the application
 * with user-friendly flash messages. All redirect methods return `never` and should be
 * preceded by a `return` statement for explicit control flow.
 *
 * @example
 * ```typescript
 * import { redirectTo } from '$lib/utils/redirects';
 *
 * // In a load function or server action
 * if (!authorized) {
 *   return redirectTo.homepage.error({
 *     title: 'Access Denied',
 *     description: 'You do not have permission to view this resource'
 *   });
 * }
 * ```
 */
export const redirectTo = {
	homepage,
	workspace,
	workspaces,
} as const;

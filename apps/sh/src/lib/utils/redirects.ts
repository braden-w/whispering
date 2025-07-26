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
 * Homepage redirect methods with flash message support
 */
const homepage = {
	/**
	 * Redirect to homepage with an error message
	 * @param message - The error message to display
	 * @returns Never - this function always throws a redirect
	 * @example
	 * ```typescript
	 * if (!authorized) {
	 *   return redirectTo.homepage.error({
	 *     title: 'Access Denied',
	 *     description: 'You do not have permission to view this page'
	 *   });
	 * }
	 * ```
	 */
	error(message: Omit<FlashMessage, 'type'>): never {
		return redirectWithFlash(302, '/', { ...message, type: 'error' });
	},

	/**
	 * Redirect to homepage with an informational message
	 * @param message - The info message to display
	 * @returns Never - this function always throws a redirect
	 * @example
	 * ```typescript
	 * return redirectTo.homepage.info({
	 *   title: 'Welcome',
	 *   description: 'Please log in to continue'
	 * });
	 * ```
	 */
	info(message: Omit<FlashMessage, 'type'>): never {
		return redirectWithFlash(302, '/', { ...message, type: 'info' });
	},

	/**
	 * Redirect to homepage with a success message
	 * @param message - The success message to display
	 * @returns Never - this function always throws a redirect
	 * @example
	 * ```typescript
	 * return redirectTo.homepage.success({
	 *   title: 'Logged Out',
	 *   description: 'You have been successfully logged out'
	 * });
	 * ```
	 */
	success(message: Omit<FlashMessage, 'type'>): never {
		return redirectWithFlash(302, '/', { ...message, type: 'success' });
	},

	/**
	 * Redirect to homepage with a warning message
	 * @param message - The warning message to display
	 * @returns Never - this function always throws a redirect
	 * @example
	 * ```typescript
	 * return redirectTo.homepage.warning({
	 *   title: 'Session Expired',
	 *   description: 'Your session has expired. Please log in again.'
	 * });
	 * ```
	 */
	warning(message: Omit<FlashMessage, 'type'>): never {
		return redirectWithFlash(302, '/', { ...message, type: 'warning' });
	},
};

/**
 * Workspaces list redirect methods with flash message support
 */
const workspaces = {
	/**
	 * Redirect to workspaces list with an error message
	 * @param message - The error message to display
	 * @returns Never - this function always throws a redirect
	 * @example
	 * ```typescript
	 * if (!workspaceConfig) {
	 *   return redirectTo.workspaces.error({
	 *     title: 'Workspace Not Found',
	 *     description: 'The workspace you requested does not exist'
	 *   });
	 * }
	 * ```
	 */
	error(message: Omit<FlashMessage, 'type'>): never {
		return redirectWithFlash(302, '/workspaces', { ...message, type: 'error' });
	},

	/**
	 * Redirect to workspaces list with an informational message
	 * @param message - The info message to display
	 * @returns Never - this function always throws a redirect
	 * @example
	 * ```typescript
	 * return redirectTo.workspaces.info({
	 *   title: 'Select Workspace',
	 *   description: 'Please choose a workspace to continue'
	 * });
	 * ```
	 */
	info(message: Omit<FlashMessage, 'type'>): never {
		return redirectWithFlash(302, '/workspaces', { ...message, type: 'info' });
	},

	/**
	 * Redirect to workspaces list with a success message
	 * @param message - The success message to display
	 * @returns Never - this function always throws a redirect
	 * @example
	 * ```typescript
	 * return redirectTo.workspaces.success({
	 *   title: 'Workspace Deleted',
	 *   description: 'The workspace has been successfully removed'
	 * });
	 * ```
	 */
	success(message: Omit<FlashMessage, 'type'>): never {
		return redirectWithFlash(302, '/workspaces', {
			...message,
			type: 'success',
		});
	},

	/**
	 * Redirect to workspaces list with a warning message
	 * @param message - The warning message to display
	 * @returns Never - this function always throws a redirect
	 * @example
	 * ```typescript
	 * return redirectTo.workspaces.warning({
	 *   title: 'Connection Unstable',
	 *   description: 'Some workspaces may be experiencing connectivity issues'
	 * });
	 * ```
	 */
	warning(message: Omit<FlashMessage, 'type'>): never {
		return redirectWithFlash(302, '/workspaces', {
			...message,
			type: 'warning',
		});
	},
};

/**
 * Individual workspace redirect methods with flash message support
 */
const workspace = {
	/**
	 * Redirect to a specific workspace with an error message
	 * @param workspaceId - The ID of the workspace to redirect to
	 * @param message - The error message to display
	 * @returns Never - this function always throws a redirect
	 * @example
	 * ```typescript
	 * if (sessionError) {
	 *   return redirectTo.workspace.error(params.id, {
	 *     title: 'Session Error',
	 *     description: sessionError.description
	 *   });
	 * }
	 * ```
	 */
	error(workspaceId: string, message: Omit<FlashMessage, 'type'>): never {
		return redirectWithFlash(302, `/workspaces/${workspaceId}` as const, {
			...message,
			type: 'error',
		});
	},

	/**
	 * Redirect to a specific workspace with an informational message
	 * @param workspaceId - The ID of the workspace to redirect to
	 * @param message - The info message to display
	 * @returns Never - this function always throws a redirect
	 * @example
	 * ```typescript
	 * if (!session) {
	 *   return redirectTo.workspace.info(params.id, {
	 *     title: 'Session Not Found',
	 *     description: 'The requested session does not exist'
	 *   });
	 * }
	 * ```
	 */
	info(workspaceId: string, message: Omit<FlashMessage, 'type'>): never {
		return redirectWithFlash(302, `/workspaces/${workspaceId}` as const, {
			...message,
			type: 'info',
		});
	},

	/**
	 * Redirect to a specific workspace with a success message
	 * @param workspaceId - The ID of the workspace to redirect to
	 * @param message - The success message to display
	 * @returns Never - this function always throws a redirect
	 * @example
	 * ```typescript
	 * return redirectTo.workspace.success(params.id, {
	 *   title: 'Session Created',
	 *   description: 'Your new conversation has been started'
	 * });
	 * ```
	 */
	success(workspaceId: string, message: Omit<FlashMessage, 'type'>): never {
		return redirectWithFlash(302, `/workspaces/${workspaceId}` as const, {
			...message,
			type: 'success',
		});
	},

	/**
	 * Redirect to a specific workspace with a warning message
	 * @param workspaceId - The ID of the workspace to redirect to
	 * @param message - The warning message to display
	 * @returns Never - this function always throws a redirect
	 * @example
	 * ```typescript
	 * return redirectTo.workspace.warning(params.id, {
	 *   title: 'Limited Functionality',
	 *   description: 'Some features may be unavailable in offline mode'
	 * });
	 * ```
	 */
	warning(workspaceId: string, message: Omit<FlashMessage, 'type'>): never {
		return redirectWithFlash(302, `/workspaces/${workspaceId}` as const, {
			...message,
			type: 'warning',
		});
	},
};

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

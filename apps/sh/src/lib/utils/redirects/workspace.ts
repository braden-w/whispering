import { redirectWithFlash } from './helpers';
import type { FlashMessage } from './types';

/**
 * Redirect to a specific workspace page with an error flash message
 * @example
 * import * as redirectTo from '$lib/utils/redirects';
 * redirectTo.workspace.error('workspace-id', { title: 'Error', description: 'Failed' })
 */
export function error(
	workspaceId: string,
	message: Omit<FlashMessage, 'type'>,
): never {
	return redirectWithFlash(302, `/workspaces/${workspaceId}` as const, {
		...message,
		type: 'error',
	});
}

/**
 * Redirect to a specific workspace page with an info flash message
 * @example
 * import * as redirectTo from '$lib/utils/redirects';
 * redirectTo.workspace.info('workspace-id', { title: 'Info', description: 'FYI' })
 */
export function info(
	workspaceId: string,
	message: Omit<FlashMessage, 'type'>,
): never {
	return redirectWithFlash(302, `/workspaces/${workspaceId}` as const, {
		...message,
		type: 'info',
	});
}

/**
 * Redirect to a specific workspace page with a success flash message
 * @example
 * import * as redirectTo from '$lib/utils/redirects';
 * redirectTo.workspace.success('workspace-id', { title: 'Success', description: 'Saved!' })
 */
export function success(
	workspaceId: string,
	message: Omit<FlashMessage, 'type'>,
): never {
	return redirectWithFlash(302, `/workspaces/${workspaceId}` as const, {
		...message,
		type: 'success',
	});
}

/**
 * Redirect to a specific workspace page with a warning flash message
 * @example
 * import * as redirectTo from '$lib/utils/redirects';
 * redirectTo.workspace.warning('workspace-id', { title: 'Warning', description: 'Be careful' })
 */
export function warning(
	workspaceId: string,
	message: Omit<FlashMessage, 'type'>,
): never {
	return redirectWithFlash(302, `/workspaces/${workspaceId}` as const, {
		...message,
		type: 'warning',
	});
}

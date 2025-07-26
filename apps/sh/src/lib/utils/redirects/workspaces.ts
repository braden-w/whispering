import { redirectWithFlash } from './helpers';
import type { FlashMessage } from './types';

/**
 * Redirect to the workspaces list page with an error flash message
 * @example
 * import * as redirectTo from '$lib/utils/redirects';
 * redirectTo.workspaces.error({ title: 'Error', description: 'Not found' })
 */
export function error(message: Omit<FlashMessage, 'type'>): never {
	return redirectWithFlash(302, '/workspaces', { ...message, type: 'error' });
}

/**
 * Redirect to the workspaces list page with an info flash message
 * @example
 * import * as redirectTo from '$lib/utils/redirects';
 * redirectTo.workspaces.info({ title: 'Info', description: 'Please select a workspace' })
 */
export function info(message: Omit<FlashMessage, 'type'>): never {
	return redirectWithFlash(302, '/workspaces', { ...message, type: 'info' });
}

/**
 * Redirect to the workspaces list page with a success flash message
 * @example
 * import * as redirectTo from '$lib/utils/redirects';
 * redirectTo.workspaces.success({ title: 'Success', description: 'Workspace deleted' })
 */
export function success(message: Omit<FlashMessage, 'type'>): never {
	return redirectWithFlash(302, '/workspaces', { ...message, type: 'success' });
}

/**
 * Redirect to the workspaces list page with a warning flash message
 * @example
 * import * as redirectTo from '$lib/utils/redirects';
 * redirectTo.workspaces.warning({ title: 'Warning', description: 'Connection unstable' })
 */
export function warning(message: Omit<FlashMessage, 'type'>): never {
	return redirectWithFlash(302, '/workspaces', { ...message, type: 'warning' });
}

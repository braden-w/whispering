import { redirectWithFlash } from './helpers';
import { type FlashMessage } from './types';

/**
 * Redirect to the homepage with an error flash message
 * @example
 * import * as redirectTo from '$lib/utils/redirects';
 * redirectTo.homepage.error({ title: 'Error', description: 'Access denied' })
 */
export function error(message: Omit<FlashMessage, 'type'>): never {
	return redirectWithFlash(302, '/', { ...message, type: 'error' });
}

/**
 * Redirect to the homepage with an info flash message
 * @example
 * import * as redirectTo from '$lib/utils/redirects';
 * redirectTo.homepage.info({ title: 'Welcome', description: 'Please log in' })
 */
export function info(message: Omit<FlashMessage, 'type'>): never {
	return redirectWithFlash(302, '/', { ...message, type: 'info' });
}

/**
 * Redirect to the homepage with a success flash message
 * @example
 * import * as redirectTo from '$lib/utils/redirects';
 * redirectTo.homepage.success({ title: 'Success', description: 'Logged out successfully' })
 */
export function success(message: Omit<FlashMessage, 'type'>): never {
	return redirectWithFlash(302, '/', { ...message, type: 'success' });
}

/**
 * Redirect to the homepage with a warning flash message
 * @example
 * import * as redirectTo from '$lib/utils/redirects';
 * redirectTo.homepage.warning({ title: 'Warning', description: 'Session expired' })
 */
export function warning(message: Omit<FlashMessage, 'type'>): never {
	return redirectWithFlash(302, '/', { ...message, type: 'warning' });
}
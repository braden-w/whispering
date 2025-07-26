/**
 * Redirect utilities with namespace exports
 * 
 * @example
 * import * as redirectTo from '$lib/utils/redirects';
 * 
 * // Redirect to homepage
 * redirectTo.homepage.error({ title: 'Error', description: 'Access denied' })
 * 
 * // Redirect to workspaces list
 * redirectTo.workspaces.error({ title: 'Error', description: 'Not found' })
 * 
 * // Redirect to specific workspace
 * redirectTo.workspace.error('workspace-id', { title: 'Error', description: 'Failed' })
 */

export * as homepage from './homepage';
export * as workspace from './workspace';
export * as workspaces from './workspaces';

// Re-export types if needed elsewhere
export type { FlashMessage } from './types';
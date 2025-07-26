import { type } from 'arktype';

/**
 * Flash message schema and type
 */
export const FlashMessage = type({
	title: 'string',
	description: 'string',
	type: "'error' | 'success' | 'info' | 'warning'",
});

export type FlashMessage = typeof FlashMessage.infer;

export const FLASH_MESSAGE_PARAMS = {
	title: 'flash_title',
	description: 'flash_description',
	type: 'flash_type',
} as const;
import { z } from 'zod';
import type { WhisperingResult } from '../index.js';

export const toastOptionsSchema = z.object({
	id: z.string().optional(),
	title: z.string(),
	description: z.string(),
	descriptionClass: z.string().optional(),
	action: z
		.discriminatedUnion('type', [
			z.object({
				type: z.literal('link'),
				label: z.string(),
				goto: z.string(),
			}),
			z.object({
				type: z.literal('more-details'),
				error: z.unknown(),
			}),
		])
		.optional(),
});

export type ToastOptions = z.infer<typeof toastOptionsSchema>;

export const notificationOptionsSchema = toastOptionsSchema.extend({
	variant: z.enum(['success', 'info', 'loading', 'error', 'warning']),
});

export type NotificationOptions = z.infer<typeof notificationOptionsSchema>;

export type NotificationService = {
	notify: (options: NotificationOptions) => Promise<WhisperingResult<string>>;
	clear: (
		id: string,
	) => Promise<WhisperingResult<void>> | WhisperingResult<void>;
};

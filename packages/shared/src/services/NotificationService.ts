import { z } from 'zod';
import type { Result } from '../index.js';

export const notificationOptionsSchema = z.object({
	id: z.string().optional(),
	title: z.string(),
	description: z.string(),
	action: z
		.object({
			type: z.literal('link'),
			label: z.string(),
			goto: z.string(),
		})
		.optional(),
});

export type NotificationOptions = z.infer<typeof notificationOptionsSchema>;

export type NotificationService = {
	notify: (options: NotificationOptions) => Promise<Result<string>>;
	clear: (id: string) => Promise<Result<void>> | Result<void>;
};

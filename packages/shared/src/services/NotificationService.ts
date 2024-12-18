import { z } from 'zod';
import type { WhisperingResult } from '../index.js';

const linkActionSchema = z.object({
	type: z.literal('link'),
	label: z.string(),
	goto: z.string(),
});

const moreDetailsActionSchema = z.object({
	type: z.literal('more-details'),
	error: z.unknown(),
});

const noneActionSchema = z.object({
	type: z.literal('none'),
});

const actionSchema = z.discriminatedUnion('type', [
	linkActionSchema,
	moreDetailsActionSchema,
	noneActionSchema,
]);

const baseNotificationOptionsSchema = z.object({
	id: z.string().optional(),
	title: z.string(),
	description: z.string(),
});

export const notificationOptionsSchema = baseNotificationOptionsSchema.extend({
	action: actionSchema.optional(),
});

export type NotificationOptions = z.infer<typeof notificationOptionsSchema>;

export type NotificationService = {
	notify: (
		options: z.infer<typeof notificationOptionsSchema> & {
			action: z.infer<typeof linkActionSchema>;
		},
	) => Promise<WhisperingResult<string>>;
	clear: (
		id: string,
	) => Promise<WhisperingResult<void>> | WhisperingResult<void>;
};

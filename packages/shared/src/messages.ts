import { z } from 'zod';
import { recordingStateSchema } from './constants.js';
import { notificationOptionsSchema } from './services/index.js';

export const externalMessageSchema = z.discriminatedUnion('name', [
	z.object({
		name: z.literal('whispering-extension/notifyWhisperingTabReady'),
		body: z.object({}),
	}),
	z.object({
		name: z.literal('whispering-extension/playSound'),
		body: z.object({
			sound: z.enum(['start', 'stop', 'cancel']),
		}),
	}),
	z.object({
		name: z.literal('whispering-extension/setClipboardText'),
		body: z.object({
			transcribedText: z.string(),
		}),
	}),
	z.object({
		name: z.literal('whispering-extension/setRecorderState'),
		body: z.object({
			recorderState: recordingStateSchema,
		}),
	}),
	z.object({
		name: z.literal('whispering-extension/notifications/create'),
		body: z.object({
			notifyOptions: notificationOptionsSchema,
		}),
	}),
	z.object({
		name: z.literal('whispering-extension/notifications/clear'),
		body: z.object({
			notificationId: z.string(),
		}),
	}),
	z.object({
		name: z.literal('whispering-extension/writeTextToCursor'),
		body: z.object({
			transcribedText: z.string(),
		}),
	}),
]);

export type ExternalMessage = z.infer<typeof externalMessageSchema>;

export type ExternalMessageBody<T extends ExternalMessage['name']> = Extract<
	ExternalMessage,
	{ name: T }
>['body'];

export type ExternalMessageReturnType<T extends ExternalMessage['name']> = {
	'whispering-extension/notifyWhisperingTabReady': undefined;
	'whispering-extension/playSound': undefined;
	'whispering-extension/setClipboardText': string;
	'whispering-extension/setRecorderState': undefined;
	'whispering-extension/notifications/create': string;
	'whispering-extension/notifications/clear': undefined;
	'whispering-extension/writeTextToCursor': string;
}[T];

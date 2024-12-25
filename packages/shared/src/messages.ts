import { z } from 'zod';
import { recordingStateSchema } from './constants.js';
import { toastAndNotificationOptionsSchema } from './services/index.js';
import type { WhisperingErrProperties } from './result.js';
import type { Result } from '@epicenterhq/result';

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
			notifyOptions: toastAndNotificationOptionsSchema,
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

export type MessageServiceResult<T> = Result<
	T,
	Pick<WhisperingErrProperties, 'title' | 'description' | 'action'>
>;

export type ExternalMessageReturnType<T extends ExternalMessage['name']> = {
	'whispering-extension/notifyWhisperingTabReady': MessageServiceResult<undefined>;
	'whispering-extension/playSound': MessageServiceResult<undefined>;
	'whispering-extension/setClipboardText': MessageServiceResult<string>;
	'whispering-extension/setRecorderState': MessageServiceResult<undefined>;
	'whispering-extension/notifications/create': MessageServiceResult<string>;
	'whispering-extension/notifications/clear': MessageServiceResult<undefined>;
	'whispering-extension/writeTextToCursor': MessageServiceResult<string>;
}[T];

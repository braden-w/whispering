import { Data } from 'effect';
import { z } from 'zod';
import { toastOptionsSchema } from './ToastService.js';
import type { ToasterProps } from 'sonner';

export const WHISPERING_URL = 'https://whispering.bradenwong.com';
export const WHISPERING_EXTENSION_ID = 'kiiocjnndmjallnnojknfblenodpbkha';

export type WhisperingErrorProperties = {
	title: string;
	description: string;
	action?: {
		label: string;
		onClick: () => void;
	};
	error?: unknown;
};

export class WhisperingError extends Data.TaggedError(
	'WhisperingError',
)<WhisperingErrorProperties> {}

export type Result<T, E = WhisperingErrorProperties> =
	| {
			isSuccess: true;
			data: T;
	  }
	| {
			isSuccess: false;
			error: E;
	  };

export const recorderStateSchema = z.enum(['IDLE', 'RECORDING', 'LOADING']);

export type RecorderState = z.infer<typeof recorderStateSchema>;

export const recorderStateToIcons = {
	RECORDING: '🔲',
	LOADING: '🔄',
	IDLE: '🎙️',
} as const satisfies Record<RecorderState, string>;

export const externalMessageSchema = z.discriminatedUnion('message', [
	z.object({ message: z.literal('setRecorderState'), recorderState: recorderStateSchema }),
	z.object({ message: z.literal('setClipboardText'), transcribedText: z.string() }),
	z.object({ message: z.literal('writeTextToCursor'), transcribedText: z.string() }),
	z.object({ message: z.literal('playSound'), sound: z.enum(['start', 'stop', 'cancel']) }),
	z.object({ message: z.literal('toast'), toastOptions: toastOptionsSchema }),
]);

export type ExternalMessage = z.infer<typeof externalMessageSchema>;

export * from './ToastService.js';

export const TOASTER_SETTINGS = {
	position: 'bottom-right',
	richColors: true,
	expand: true,
	duration: 5000,
	visibleToasts: 5,
} satisfies ToasterProps;

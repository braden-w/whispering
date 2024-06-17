import { Schema as S } from '@effect/schema';
import { Context, Data, Effect } from 'effect';
import type { ToasterProps } from 'sonner';

export const WHISPERING_URL = 'https://whispering.bradenwong.com';
export const WHISPERING_EXTENSION_ID = 'kiiocjnndmjallnnojknfblenodpbkha';

const BaseError = S.Struct({
	title: S.String,
	description: S.String,
	action: S.optional(
		S.Struct({
			label: S.String,
			goto: S.String,
		}),
	),
});

export const settingsSchema = S.Struct({
	isPlaySoundEnabled: S.Boolean,
	isCopyToClipboardEnabled: S.Boolean,
	isPasteContentsOnSuccessEnabled: S.Boolean,
	selectedAudioInputDeviceId: S.String,
	currentLocalShortcut: S.String,
	currentGlobalShortcut: S.String,
	apiKey: S.String,
	outputLanguage: S.String,
});

export type Settings = S.Schema.Type<typeof settingsSchema>;

const ToastId = S.Union(S.String, S.Number);

export const toastOptionsSchema = S.Struct({
	variant: S.Literal('success', 'info', 'loading', 'error'),
	id: S.optional(ToastId),
	...BaseError.fields,
	descriptionClass: S.optional(S.String),
});

type ToastId = S.Schema.Type<typeof ToastId>;

export type ToastOptions = S.Schema.Type<typeof toastOptionsSchema>;

export class ToastService extends Context.Tag('ToastService')<
	ToastService,
	{
		toast: (options: ToastOptions) => ToastId;
	}
>() {}

const WhisperingErrorProperties = S.Struct({
	...BaseError.fields,
	error: S.optional(S.Unknown),
});

export type WhisperingErrorProperties = S.Schema.Type<typeof WhisperingErrorProperties>;

export class WhisperingError extends Data.TaggedError(
	'WhisperingError',
)<WhisperingErrorProperties> {}

export type Result<T> =
	| {
			isSuccess: true;
			data: T;
	  }
	| {
			isSuccess: false;
			error: WhisperingErrorProperties;
	  };

export const effectToResult = <A, I extends WhisperingError = WhisperingError, R>(
	effect: Effect.Effect<A, I, R>,
): Effect.Effect<Result<A>> => effect.pipe(effectToResult);

export const RecorderState = S.Literal('IDLE', 'RECORDING', 'LOADING');

export type RecorderState = S.Schema.Type<typeof RecorderState>;

export const recorderStateToIcons = {
	RECORDING: '🔲',
	LOADING: '🔄',
	IDLE: '🎙️',
} as const satisfies Record<RecorderState, string>;

export const externalMessageSchema = S.Union(
	S.Struct({
		message: S.Literal('setRecorderState'),
		recorderState: RecorderState,
	}),
	S.Struct({
		message: S.Literal('setClipboardText'),
		transcribedText: S.String,
	}),
	S.Struct({
		message: S.Literal('writeTextToCursor'),
		transcribedText: S.String,
	}),
	S.Struct({
		message: S.Literal('playSound'),
		sound: S.Literal('start', 'stop', 'cancel'),
	}),
	S.Struct({
		message: S.Literal('toast'),
		toastOptions: toastOptionsSchema,
	}),
);

export type ExternalMessage = S.Schema.Type<typeof externalMessageSchema>;

export const TOASTER_SETTINGS = {
	position: 'bottom-right',
	richColors: true,
	expand: true,
	duration: 5000,
	visibleToasts: 5,
} satisfies ToasterProps;

export * from './services/index.js';

import { Schema as S } from '@effect/schema';
import { Context, Data, Effect } from 'effect';
import type { ToasterProps } from 'sonner';

export const WHISPERING_URL =
	process.env.NODE_ENV === 'production'
		? 'https://whispering.bradenwong.com'
		: 'http://localhost:5173';
export const WHISPERING_URL_WILDCARD = `${WHISPERING_URL}/*` as const;

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
		toast: (options: ToastOptions) => Effect.Effect<ToastId>;
	}
>() {}

const WhisperingErrorProperties = S.Struct({
	...BaseError.fields,
	error: S.optional(S.Unknown),
});

type WhisperingErrorProperties = S.Schema.Type<typeof WhisperingErrorProperties>;

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

export const effectToResult = <T>(
	effect: Effect.Effect<T, WhisperingError>,
): Effect.Effect<Result<T>> =>
	effect.pipe(
		Effect.map((data) => ({ isSuccess: true, data }) as const),
		Effect.catchAll((error) => Effect.succeed({ isSuccess: false, error } as const)),
	);

export const resultToEffect = <T>(result: Result<T>): Effect.Effect<T, WhisperingError> =>
	result.isSuccess ? Effect.succeed(result.data) : Effect.fail(new WhisperingError(result.error));

export const recorderStateSchema = S.Literal('IDLE', 'RECORDING', 'LOADING');

export type RecorderState = S.Schema.Type<typeof recorderStateSchema>;

export const recorderStateToIcons = {
	RECORDING: '🔲',
	LOADING: '🔄',
	IDLE: '🎙️',
} as const satisfies Record<RecorderState, string>;

export const externalMessageSchema = S.Union(
	S.Struct({
		name: S.Literal('external/setRecorderState'),
		body: S.Struct({ recorderState: recorderStateSchema }),
	}),
	S.Struct({
		name: S.Literal('external/setClipboardText'),
		body: S.Struct({ transcribedText: S.String }),
	}),
	S.Struct({
		name: S.Literal('external/writeTextToCursor'),
		body: S.Struct({ transcribedText: S.String }),
	}),
	S.Struct({
		name: S.Literal('external/playSound'),
		body: S.Struct({ sound: S.Literal('start', 'stop', 'cancel') }),
	}),
	S.Struct({
		name: S.Literal('external/toast'),
		body: S.Struct({ toastOptions: toastOptionsSchema }),
	}),
	S.Struct({
		name: S.Literal('external/getTabSenderId'),
		body: S.Struct({}),
	}),
	S.Struct({
		name: S.Literal('external/notifyWhisperingTabReady'),
		body: S.Struct({tabId: S.Number}),
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

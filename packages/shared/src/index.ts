import { Schema as S } from '@effect/schema';
import { Context, Data, Effect } from 'effect';

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

export const toastOptionsSchema = S.Struct({
	variant: S.Literal('success', 'info', 'loading', 'error'),
	id: S.optional(S.String),
	...BaseError.fields,
	descriptionClass: S.optional(S.String),
});

export type ToastOptions = S.Schema.Type<typeof toastOptionsSchema>;

export class ToastService extends Context.Tag('ToastService')<
	ToastService,
	{
		toast: (options: ToastOptions) => Effect.Effect<string>;
	}
>() {}

export const notificationOptionsSchema = S.Struct({
	id: S.optional(S.String),
	...BaseError.fields,
});

type NotificationOptions = S.Schema.Type<typeof notificationOptionsSchema>;

export class NotificationService extends Context.Tag('NotificationService')<
	NotificationService,
	{
		notify: (options: NotificationOptions) => Effect.Effect<string>;
		clear: (id: string) => Effect.Effect<void>;
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
		name: S.Literal('external/notifyWhisperingTabReady'),
		body: S.Struct({}),
	}),
	S.Struct({
		name: S.Literal('external/playSound'),
		body: S.Struct({ sound: S.Literal('start', 'stop', 'cancel') }),
	}),
	S.Struct({
		name: S.Literal('external/setClipboardText'),
		body: S.Struct({ transcribedText: S.String }),
	}),
	S.Struct({
		name: S.Literal('external/setTrayIcon'),
		body: S.Struct({ recorderState: recorderStateSchema }),
	}),
	S.Struct({
		name: S.Literal('external/notifications/create'),
		body: S.Struct({ notifyOptions: notificationOptionsSchema }),
	}),
	S.Struct({
		name: S.Literal('external/notifications/clear'),
		body: S.Struct({ notificationId: S.String }),
	}),
	S.Struct({
		name: S.Literal('external/writeTextToCursor'),
		body: S.Struct({ transcribedText: S.String }),
	}),
);

export type ExternalMessage = S.Schema.Type<typeof externalMessageSchema>;

export type ExternalMessageNameToReturnType = {
	'external/notifyWhisperingTabReady': void;
	'external/playSound': void;
	'external/setClipboardText': void;
	'external/setTrayIcon': void;
	'external/notifications/create': string;
	'external/notifications/clear': void;
	'external/writeTextToCursor': void;
};

export * from './services/index.js';

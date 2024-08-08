import { Schema as S } from '@effect/schema';
import { Data, Effect } from 'effect';
import { notificationOptionsSchema } from './services/NotificationService.js';
import { SUPPORTED_LANGUAGES, TRANSCRIPTION_SERVICES } from './services/TranscriptionService.js';

export const WHISPERING_URL =
	process.env.NODE_ENV === 'production'
		? 'https://whispering.bradenwong.com'
		: 'http://localhost:5173';

export const WHISPERING_URL_WILDCARD = `${WHISPERING_URL}/*` as const;

export const BITRATE_VALUES = [64_000, 96_000, 128_000, 192_000, 256_000, 320_000] as const;
export const BITRATE_OPTIONS = BITRATE_VALUES.map((bitrate) => ({
	label: `${bitrate / 1_000} kbps`,
	value: bitrate,
}));
export const DEFAULT_BITRATE_MS = 64_000 as const satisfies (typeof BITRATE_VALUES)[number];

export const settingsSchema = S.Struct({
	isPlaySoundEnabled: S.Boolean,
	isCopyToClipboardEnabled: S.Boolean,
	isPasteContentsOnSuccessEnabled: S.Boolean,
	selectedAudioInputDeviceId: S.String,
	currentLocalShortcut: S.String,
	currentGlobalShortcut: S.String,
	selectedTranscriptionService: S.Literal(...TRANSCRIPTION_SERVICES),
	openAiApiKey: S.String,
	groqApiKey: S.String,
	fasterWhisperServerUrl: S.String,
	fasterWhisperServerModel: S.String,
	outputLanguage: S.Literal(...SUPPORTED_LANGUAGES),
	bitsPerSecond: S.optionalWith(S.compose(S.Number, S.Literal(...BITRATE_VALUES)), {
		default: () => DEFAULT_BITRATE_MS,
	}),
});

export const getDefaultSettings = (platform: 'app' | 'extension') =>
	({
		isPlaySoundEnabled: true,
		isCopyToClipboardEnabled: true,
		isPasteContentsOnSuccessEnabled: true,
		selectedAudioInputDeviceId: 'default',
		currentLocalShortcut: 'space',
		currentGlobalShortcut: platform === 'app' ? 'CommandOrControl+Shift+;' : '',
		selectedTranscriptionService: 'OpenAI',
		openAiApiKey: '',
		groqApiKey: '',
		fasterWhisperServerUrl: 'http://localhost:8000',
		fasterWhisperServerModel: 'Systran/faster-distil-whisper-large-v3',
		outputLanguage: 'auto',
		bitsPerSecond: DEFAULT_BITRATE_MS,
	}) satisfies Settings;

export type Settings = S.Schema.Type<typeof settingsSchema>;

export type WhisperingErrorProperties = {
	variant?: 'error' | 'warning';
	title: string;
	description: string;
	action?:
		| {
				label: string;
				goto: string;
		  }
		| undefined;
	error?: unknown;
};

export class WhisperingError extends Data.TaggedError('WhisperingError')<
	Required<Pick<WhisperingErrorProperties, 'variant'>> & Omit<WhisperingErrorProperties, 'variant'>
> {
	constructor(properties: WhisperingErrorProperties) {
		super({
			...properties,
			variant: properties.variant ?? 'error',
		});
	}
}

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

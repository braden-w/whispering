import {
	type Result,
	createServiceErrorFns,
	trySync,
} from '@epicenterhq/result';
import { z } from 'zod';
import type { ToastOptions } from './services/ToastAndNotificationService.js';
import { notificationOptionsSchema } from './services/ToastAndNotificationService.js';
import {
	SUPPORTED_LANGUAGES,
	TRANSCRIPTION_SERVICES,
} from './services/index.js';
export { Err, Ok } from '@epicenterhq/result';
export type {
	NotificationServiceOptions,
	ToastOptions,
} from './services/ToastAndNotificationService.js';
export { WhisperingErr, tryAsyncWhispering, trySyncWhispering };

export const WHISPERING_URL =
	process.env.NODE_ENV === 'production'
		? 'https://whispering.bradenwong.com'
		: 'http://localhost:5173';

export const WHISPERING_URL_WILDCARD = `${WHISPERING_URL}/*` as const;

export const WHISPERING_RECORDINGS_PATHNAME = '/recordings' as const;

export const BITRATE_VALUES_KBPS = [
	'64',
	'96',
	'128',
	'192',
	'256',
	'320',
] as const;
export const BITRATE_OPTIONS = BITRATE_VALUES_KBPS.map((bitrate) => ({
	label: `${bitrate} kbps`,
	value: bitrate,
}));
export const DEFAULT_BITRATE_KBPS =
	'64' as const satisfies (typeof BITRATE_VALUES_KBPS)[number];

const ALWAYS_ON_TOP_VALUES = [
	'Always',
	'Never',
	'When Recording',
	'When Recording and Transcribing',
] as const;
export const ALWAYS_ON_TOP_OPTIONS = ALWAYS_ON_TOP_VALUES.map((option) => ({
	label: option,
	value: option,
}));

export const settingsSchema = z.object({
	isPlaySoundEnabled: z.boolean(),
	isCopyToClipboardEnabled: z.boolean(),
	isPasteContentsOnSuccessEnabled: z.boolean(),
	isFasterRerecordEnabled: z.boolean(),
	alwaysOnTop: z.enum(ALWAYS_ON_TOP_VALUES),

	selectedAudioInputDeviceId: z.string(),
	bitrateKbps: z
		.enum(BITRATE_VALUES_KBPS)
		.optional()
		.default(DEFAULT_BITRATE_KBPS),

	selectedTranscriptionService: z.enum(TRANSCRIPTION_SERVICES),
	openAiApiKey: z.string(),
	groqApiKey: z.string(),
	fasterWhisperServerUrl: z.string(),
	fasterWhisperServerModel: z.string(),
	outputLanguage: z.enum(SUPPORTED_LANGUAGES),

	currentLocalShortcut: z.string(),
	currentGlobalShortcut: z.string(),
});

export type Settings = z.infer<typeof settingsSchema>;

export const getDefaultSettings = (platform: 'app' | 'extension') =>
	({
		isPlaySoundEnabled: true,
		isCopyToClipboardEnabled: true,
		isPasteContentsOnSuccessEnabled: true,
		isFasterRerecordEnabled: false,
		alwaysOnTop: 'When Recording',

		selectedAudioInputDeviceId: 'default',
		bitrateKbps: DEFAULT_BITRATE_KBPS,

		selectedTranscriptionService: 'OpenAI',
		openAiApiKey: '',
		groqApiKey: '',
		fasterWhisperServerUrl: 'http://localhost:8000',
		fasterWhisperServerModel: 'Systran/faster-whisper-medium.en',
		outputLanguage: 'auto',

		currentLocalShortcut: 'space',
		currentGlobalShortcut: platform === 'app' ? 'CommandOrControl+Shift+;' : '',
	}) satisfies Settings;

export type WhisperingErrProperties = {
	_tag: 'WhisperingError';
	isWarning?: boolean;
} & ToastOptions;

export type WhisperingResult<T> = Result<T, WhisperingErrProperties>;

const {
	Err: WhisperingErr,
	trySync: trySyncWhispering,
	tryAsync: tryAsyncWhispering,
} = createServiceErrorFns<WhisperingErrProperties>();

export const parseJson = (value: string) =>
	trySync({
		try: () => JSON.parse(value) as unknown,
		catch: (error) => ({ _tag: 'ParseJsonError', error }),
	});

export const recordingStateSchema = z.enum([
	'IDLE',
	'SESSION',
	'SESSION+RECORDING',
]);

export type WhisperingRecordingState = z.infer<typeof recordingStateSchema>;

export const recorderStateToIcons = {
	IDLE: '🎙️',
	SESSION: '🎙️',
	'SESSION+RECORDING': '🔲',
} as const satisfies Record<WhisperingRecordingState, string>;

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

export * from './services/index.js';

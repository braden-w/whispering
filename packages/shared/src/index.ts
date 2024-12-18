import type {
	Err as EpicenterErr,
	Ok as EpicenterOk,
	Result as EpicenterResult,
} from '@epicenterhq/result';
import { z } from 'zod';
import { notificationOptionsSchema } from './services/NotificationService.js';
import {
	SUPPORTED_LANGUAGES,
	TRANSCRIPTION_SERVICES,
} from './services/index.js';

export const WHISPERING_URL =
	process.env.NODE_ENV === 'production'
		? 'https://whispering.bradenwong.com'
		: 'http://localhost:5173';

export const WHISPERING_URL_WILDCARD = `${WHISPERING_URL}/*` as const;

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

const ALWAYS_ON_TOP_VALUES = ['Always', 'Never', 'When Recording'] as const;
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
	bitsPerSecond: z
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
		bitsPerSecond: DEFAULT_BITRATE_KBPS,

		selectedTranscriptionService: 'OpenAI',
		openAiApiKey: '',
		groqApiKey: '',
		fasterWhisperServerUrl: 'http://localhost:8000',
		fasterWhisperServerModel: 'Systran/faster-whisper-medium.en',
		outputLanguage: 'auto',

		currentLocalShortcut: 'space',
		currentGlobalShortcut: platform === 'app' ? 'CommandOrControl+Shift+;' : '',
	}) satisfies Settings;

export type WhisperingError = {
	_tag: 'WhisperingError';
	title: string;
	description: string;
	action:
		| {
				type: 'link';
				label: string;
				goto: string;
		  }
		| {
				type: 'more-details';
				error: unknown;
		  }
		| { type: 'none' };
	isWarning?: boolean;
};

export type BubbleError<T extends string = string> = {
	_tag: T;
	message: string;
};

export type Result<
	T,
	E extends BubbleError | WhisperingError = WhisperingError,
> = EpicenterResult<T, E>;

export const Ok = <T>(data: T): EpicenterOk<T> => ({ ok: true, data });

export const Err = <E extends BubbleError | WhisperingError>(
	error: E,
): EpicenterErr<E> => ({ ok: false, error });

export function trySync<T, E extends BubbleError | WhisperingError>({
	try: fn,
	catch: errorHandler,
}: { try: () => T; catch: (error: unknown) => E }): Result<T, E> {
	try {
		const data = fn();
		return { ok: true, data };
	} catch (error) {
		return { ok: false, error: errorHandler(error) };
	}
}

export async function tryAsync<T, E extends BubbleError | WhisperingError>({
	try: fn,
	catch: errorHandler,
}: { try: () => Promise<T>; catch: (error: unknown) => E }): Promise<
	Result<T, E>
> {
	try {
		const data = await fn();
		return { ok: true, data };
	} catch (error) {
		return { ok: false, error: errorHandler(error) };
	}
}

export const parseJson = (
	value: string,
): Result<unknown, BubbleError<'ParseJsonError'>> =>
	trySync({
		try: () => JSON.parse(value) as unknown,
		catch: (error) => ({
			_tag: 'ParseJsonError',
			message: error instanceof Error ? error.message : 'Unexpected JSON input',
		}),
	});

export const recorderStateSchema = z.enum(['IDLE', 'RECORDING', 'LOADING']);

export type RecorderState = z.infer<typeof recorderStateSchema>;

export const recorderStateToIcons = {
	RECORDING: '🔲',
	LOADING: '🔄',
	IDLE: '🎙️',
} as const satisfies Record<RecorderState, string>;

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
		name: z.literal('whispering-extension/setTrayIcon'),
		body: z.object({
			recorderState: recorderStateSchema,
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
	'whispering-extension/setTrayIcon': undefined;
	'whispering-extension/notifications/create': string;
	'whispering-extension/notifications/clear': undefined;
	'whispering-extension/writeTextToCursor': string;
}[T];

export * from './services/index.js';

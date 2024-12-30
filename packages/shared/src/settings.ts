import { z } from 'zod';
import {
	ALWAYS_ON_TOP_VALUES,
	BITRATE_VALUES_KBPS,
	DEFAULT_BITRATE_KBPS,
	SUPPORTED_LANGUAGES,
	TRANSCRIPTION_SERVICES,
} from './constants.js';

// Recording retention configuration
export const RETENTION_STRATEGIES = ['keep-forever', 'limit-count'] as const;

export const getDefaultSettings = (platform: 'app' | 'extension') =>
	({
		isPlaySoundEnabled: true,
		isCopyToClipboardEnabled: true,
		isPasteContentsOnSuccessEnabled: true,
		isFasterRerecordEnabled: false,
		closeToTray: false,
		alwaysOnTop: 'When Recording',

		// Recording retention defaults
		recordingRetentionStrategy: 'keep-forever',
		maxRecordingCount: '5',

		selectedAudioInputDeviceId: 'default',
		bitrateKbps: DEFAULT_BITRATE_KBPS,

		selectedTranscriptionService: 'OpenAI',
		outputLanguage: 'auto',
		prompt: '',
		temperature: '0',

		openAiApiKey: '',

		groqApiKey: '',

		fasterWhisperServerUrl: 'http://localhost:8000',
		fasterWhisperServerModel: 'Systran/faster-whisper-medium.en',

		currentLocalShortcut: 'space',
		currentGlobalShortcut: platform === 'app' ? 'CommandOrControl+Shift+;' : '',
	}) satisfies Settings;

export const settingsSchema = z.object({
	isPlaySoundEnabled: z.boolean(),
	isCopyToClipboardEnabled: z.boolean(),
	isPasteContentsOnSuccessEnabled: z.boolean(),
	isFasterRerecordEnabled: z.boolean(),
	closeToTray: z.boolean(),
	alwaysOnTop: z.enum(ALWAYS_ON_TOP_VALUES),

	// Auto delete recordings settings
	recordingRetentionStrategy: z.enum(RETENTION_STRATEGIES),
	maxRecordingCount: z.string().regex(/^\d+$/, 'Must be a number'),

	selectedAudioInputDeviceId: z.string(),
	bitrateKbps: z
		.enum(BITRATE_VALUES_KBPS)
		.optional()
		.default(DEFAULT_BITRATE_KBPS),

	selectedTranscriptionService: z.enum(TRANSCRIPTION_SERVICES),
	outputLanguage: z.enum(SUPPORTED_LANGUAGES),
	prompt: z.string(),
	temperature: z.string(),

	openAiApiKey: z.string(),

	groqApiKey: z.string(),

	fasterWhisperServerUrl: z.string(),
	fasterWhisperServerModel: z.string(),

	currentLocalShortcut: z.string(),
	currentGlobalShortcut: z.string(),
});

export type Settings = z.infer<typeof settingsSchema>;

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
		alwaysOnTop: 'Never',

		// Recording retention defaults
		recordingRetentionStrategy: 'keep-forever',
		maxRecordingCount: '5',

		'recording.selectedAudioInputDeviceId': 'default',
		'recording.bitrateKbps': DEFAULT_BITRATE_KBPS,

		'transcription.selectedTranscriptionService': 'OpenAI',
		'transcription.outputLanguage': 'auto',
		'transcription.prompt': '',
		'transcription.temperature': '0',

		'transcription.openAi.apiKey': '',

		'transcription.groq.apiKey': '',

		'transcription.fasterWhisperServer.serverUrl': 'http://localhost:8000',
		'transcription.fasterWhisperServer.serverModel':
			'Systran/faster-whisper-medium.en',

		'shortcuts.currentLocalShortcut': 'space',
		'shortcuts.currentGlobalShortcut':
			platform === 'app' ? 'CommandOrControl+Shift+;' : '',
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

	'recording.selectedAudioInputDeviceId': z.string(),
	'recording.bitrateKbps': z
		.enum(BITRATE_VALUES_KBPS)
		.optional()
		.default(DEFAULT_BITRATE_KBPS),

	// Shared transcription settings
	'transcription.selectedTranscriptionService': z.enum(TRANSCRIPTION_SERVICES),
	'transcription.outputLanguage': z.enum(SUPPORTED_LANGUAGES),
	'transcription.prompt': z.string(),
	'transcription.temperature': z.string(),

	// Service-specific settings
	'transcription.openAi.apiKey': z.string(),
	'transcription.groq.apiKey': z.string(),
	'transcription.fasterWhisperServer.serverUrl': z.string(),
	'transcription.fasterWhisperServer.serverModel': z.string(),

	'shortcuts.currentLocalShortcut': z.string(),
	'shortcuts.currentGlobalShortcut': z.string(),
});

export type Settings = z.infer<typeof settingsSchema>;

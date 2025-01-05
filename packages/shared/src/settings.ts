import { z } from 'zod';
import {
	ALWAYS_ON_TOP_VALUES,
	BITRATE_VALUES_KBPS,
	DEFAULT_BITRATE_KBPS,
	GROQ_MODELS,
	SUPPORTED_LANGUAGES,
	TRANSCRIPTION_SERVICES,
} from './constants.js';

export const getDefaultSettings = (platform: 'app' | 'extension') =>
	({
		'sound.playOnStartSuccess': true,
		'sound.playOnStopSuccess': true,
		'sound.playOnCancelSuccess': true,
		'sound.playOnTranscriptionSuccess': true,
		'transcription.clipboard.copyOnSuccess': true,
		'transcription.clipboard.pasteOnSuccess': true,
		'recording.isFasterRerecordEnabled': false,
		'system.closeToTray': false,
		'system.alwaysOnTop': 'Never',

		// Recording retention defaults
		'database.recordingRetentionStrategy': 'keep-forever',
		'database.maxRecordingCount': '5',

		'recording.selectedAudioInputDeviceId': 'default',
		'recording.bitrateKbps': DEFAULT_BITRATE_KBPS,

		'transcription.selectedTranscriptionService': 'OpenAI',
		'transcription.groq.model': 'whisper-large-v3',
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
	'sound.playOnStartSuccess': z.boolean(),
	'sound.playOnStopSuccess': z.boolean(),
	'sound.playOnCancelSuccess': z.boolean(),
	'sound.playOnTranscriptionSuccess': z.boolean(),
	'transcription.clipboard.copyOnSuccess': z.boolean(),
	'transcription.clipboard.pasteOnSuccess': z.boolean(),
	'recording.isFasterRerecordEnabled': z.boolean(),

	'system.closeToTray': z.boolean(),
	'system.alwaysOnTop': z.enum(ALWAYS_ON_TOP_VALUES),

	'database.recordingRetentionStrategy': z.enum([
		'keep-forever',
		'limit-count',
	] as const),
	'database.maxRecordingCount': z.string().regex(/^\d+$/, 'Must be a number'),

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
	'transcription.groq.model': z.enum(GROQ_MODELS),
	'transcription.fasterWhisperServer.serverUrl': z.string(),
	'transcription.fasterWhisperServer.serverModel': z.string(),

	'inference.openAi.apiKey': z.string(),
	'inference.anthropic.apiKey': z.string(),
	'inference.groq.apiKey': z.string(),

	'shortcuts.currentLocalShortcut': z.string(),
	'shortcuts.currentGlobalShortcut': z.string(),
});

export type Settings = z.infer<typeof settingsSchema>;

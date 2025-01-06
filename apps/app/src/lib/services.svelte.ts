import { queryClient } from '../routes/+layout.svelte';
import { recordingsKeys } from './queries/recordings';
import {
	createSetTrayIconDesktopService,
	createSetTrayIconWebService,
} from './services/SetTrayIconService';
import { createClipboardServiceDesktop } from './services/clipboard/ClipboardService.desktop';
import { createClipboardServiceWeb } from './services/clipboard/ClipboardService.web';
import {
	type Recording,
	type Transformation,
	createDbDexieService,
} from './services/db/DbService.dexie';
import { createDownloadServiceDesktop } from './services/download/DownloadService.desktop';
import { createDownloadServiceWeb } from './services/download/DownloadService.web';
import { createHttpServiceDesktop } from './services/http/HttpService.desktop';
import { createHttpServiceWeb } from './services/http/HttpService.web';
import { createNotificationServiceDesktop } from './services/notifications/NotificationService.desktop';
import { createNotificationServiceWeb } from './services/notifications/NotificationService.web';
import { createRecorderServiceTauri } from './services/recorder/RecorderService.tauri';
import { createRecorderServiceWeb } from './services/recorder/RecorderService.web';
import { createPlaySoundServiceDesktop } from './services/sound/PlaySoundService.desktop';
import { createPlaySoundServiceWeb } from './services/sound/PlaySoundService.web';
import { createTranscriptionServiceFasterWhisperServer } from './services/transcription/TranscriptionService.fasterWhisperServer';
import { createTranscriptionServiceGroqDistil } from './services/transcription/TranscriptionService.groq.distil';
import { createTranscriptionServiceGroqLarge } from './services/transcription/TranscriptionService.groq.large';
import { createTranscriptionServiceGroqTurbo } from './services/transcription/TranscriptionService.groq.turbo';
import { createTranscriptionServiceOpenAi } from './services/transcription/TranscriptionService.openai';
import { runTransformationOnInput } from './services/transformation/TransformationService';
import { settings } from './stores/settings.svelte';

// Services that are not determined by the user's settings, but by the platform.

export const DownloadService = window.__TAURI_INTERNALS__
	? createDownloadServiceDesktop()
	: createDownloadServiceWeb();

export const NotificationService = window.__TAURI_INTERNALS__
	? createNotificationServiceDesktop()
	: createNotificationServiceWeb();

export const ClipboardService = window.__TAURI_INTERNALS__
	? createClipboardServiceDesktop()
	: createClipboardServiceWeb();

export const SetTrayIconService = window.__TAURI_INTERNALS__
	? createSetTrayIconDesktopService()
	: createSetTrayIconWebService();

export const DbService = createDbDexieService();

const HttpService = window.__TAURI_INTERNALS__
	? createHttpServiceDesktop()
	: createHttpServiceWeb();

const PlaySoundService = window.__TAURI_INTERNALS__
	? createPlaySoundServiceDesktop()
	: createPlaySoundServiceWeb();

/**
 * Services that are determined by the user's settings.
 */
export const userConfiguredServices = (() => {
	const RecorderServiceTauri = createRecorderServiceTauri();
	const RecorderServiceWeb = createRecorderServiceWeb();

	return {
		transformations: {
			runTransformationOnInput: async (
				input: string,
				transformation: Transformation,
			) => {
				return runTransformationOnInput(input, transformation, HttpService);
			},
		},
		db: {
			createRecording: async (recording: Recording) => {
				const result = await DbService.createRecording(recording);
				if (!result.ok) return result;

				queryClient.setQueryData<Recording[]>(recordingsKeys.all, (oldData) => {
					if (!oldData) return [result.data];
					return [...oldData, result.data];
				});

				return result;
			},
			updateRecording: async (recording: Recording) => {
				const result = await DbService.updateRecording(recording);
				if (!result.ok) return result;

				queryClient.setQueryData<Recording[]>(recordingsKeys.all, (oldData) => {
					if (!oldData) return [result.data];
					return oldData.map((item) =>
						item.id === recording.id ? recording : item,
					);
				});

				return result;
			},
			deleteRecording: async (recording: Recording) => {
				const result = await DbService.deleteRecording(recording);
				if (!result.ok) return result;

				queryClient.setQueryData<Recording[]>(recordingsKeys.all, (oldData) => {
					if (!oldData) return [];
					return oldData.filter((item) => item.id !== recording.id);
				});

				return result;
			},
			deleteRecordings: async (recordings: Recording[]) => {
				const result = await DbService.deleteRecordings(recordings);
				if (!result.ok) return result;

				queryClient.setQueryData<Recording[]>(recordingsKeys.all, (oldData) => {
					if (!oldData) return [];
					const deletedIds = new Set(recordings.map((r) => r.id));
					return oldData.filter((item) => !deletedIds.has(item.id));
				});

				return result;
			},
		},
		get transcription() {
			switch (settings.value['transcription.selectedTranscriptionService']) {
				case 'OpenAI':
					return createTranscriptionServiceOpenAi({
						HttpService,
						settings: settings.value,
					});
				case 'Groq': {
					switch (settings.value['transcription.groq.model']) {
						case 'whisper-large-v3':
							return createTranscriptionServiceGroqLarge({
								HttpService,
								settings: settings.value,
							});
						case 'whisper-large-v3-turbo':
							return createTranscriptionServiceGroqTurbo({
								HttpService,
								settings: settings.value,
							});
						case 'distil-whisper-large-v3-en':
							return createTranscriptionServiceGroqDistil({
								HttpService,
								settings: settings.value,
							});
						default:
							return createTranscriptionServiceGroqLarge({
								HttpService,
								settings: settings.value,
							});
					}
				}
				case 'faster-whisper-server':
					return createTranscriptionServiceFasterWhisperServer({
						HttpService,
						settings: settings.value,
					});
				default:
					return createTranscriptionServiceOpenAi({
						HttpService,
						settings: settings.value,
					});
			}
		},
		get recorder() {
			if (settings.value['recorder.selectedRecorderService'] === 'Tauri') {
				return RecorderServiceTauri;
			}
			return RecorderServiceWeb;
		},
		sound: {
			playStartSoundIfEnabled: () => {
				if (settings.value['sound.playOnStartSuccess']) {
					void PlaySoundService.playSound('start');
				}
			},
			playStopSoundIfEnabled: () => {
				if (settings.value['sound.playOnStopSuccess']) {
					void PlaySoundService.playSound('stop');
				}
			},
			playCancelSoundIfEnabled: () => {
				if (settings.value['sound.playOnCancelSuccess']) {
					void PlaySoundService.playSound('cancel');
				}
			},
			playTranscriptionCompleteSoundIfEnabled: () => {
				if (settings.value['sound.playOnTranscriptionSuccess']) {
					void PlaySoundService.playSound('transcription-complete');
				}
			},
		},
	};
})();

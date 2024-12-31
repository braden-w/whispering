import { settings } from '$lib/stores/settings.svelte';
import {
	createSetTrayIconDesktopService,
	createSetTrayIconWebService,
} from './services/SetTrayIconService';
import { createClipboardServiceDesktop } from './services/clipboard/ClipboardService.desktop';
import { createClipboardServiceWeb } from './services/clipboard/ClipboardService.web';
import { createRecordingsIndexedDbService } from './services/db/RecordingsService.svelte.indexedDb';
import { createDownloadServiceDesktop } from './services/download/DownloadService.desktop';
import { createDownloadServiceWeb } from './services/download/DownloadService.web';
import { createHttpServiceDesktop } from './services/http/HttpService.desktop';
import { createHttpServiceWeb } from './services/http/HttpService.web';
import { createNotificationServiceDesktop } from './services/notifications/NotificationService.desktop';
import { createNotificationServiceWeb } from './services/notifications/NotificationService.web';
import { createRecorderServiceWeb } from './services/recorder/RecorderService.web';
import { createPlaySoundServiceDesktop } from './services/sound/PlaySoundService.desktop';
import { createPlaySoundServiceWeb } from './services/sound/PlaySoundService.web';
import { createTranscriptionServiceFasterWhisperServer } from './services/transcription/TranscriptionService.fasterWhisperServer';
import { createTranscriptionServiceGroq } from './services/transcription/TranscriptionService.groq';
import { createTranscriptionServiceWhisper } from './services/transcription/TranscriptionService.whisper';

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

export const RecordingsService = createRecordingsIndexedDbService();

/**
 * Services that are determined by the user's settings.
 */
export const userConfiguredServices = createServices();

function createServices() {
	const HttpService = window.__TAURI_INTERNALS__
		? createHttpServiceDesktop()
		: createHttpServiceWeb();

	const TranscriptionService = $derived.by(() => {
		switch (settings.value['transcription.selectedTranscriptionService']) {
			case 'OpenAI':
				return createTranscriptionServiceWhisper({ HttpService });
			case 'Groq':
				return createTranscriptionServiceGroq({ HttpService });
			case 'faster-whisper-server':
				return createTranscriptionServiceFasterWhisperServer({ HttpService });
		}
	});

	const RecorderService = createRecorderServiceWeb();

	const PlaySoundService = window.__TAURI_INTERNALS__
		? createPlaySoundServiceDesktop()
		: createPlaySoundServiceWeb();

	return {
		transcription: TranscriptionService,
		recorder: RecorderService,
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
}

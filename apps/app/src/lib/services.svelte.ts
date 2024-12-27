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
import { NotificationServiceDesktopLive } from './services/notifications/NotificationService.desktop';
import { NotificationServiceWebLive } from './services/notifications/NotificationService.web';
import { createRecorderServiceTauri } from './services/recorder/RecorderService.tauri';
import { createRecorderServiceWeb } from './services/recorder/RecorderService.web';
import { createTranscriptionServiceFasterWhisperServer } from './services/transcription/TranscriptionService.fasterWhisperServer';
import { createTranscriptionServiceGroq } from './services/transcription/TranscriptionService.groq';
import { createTranscriptionServiceWhisper } from './services/transcription/TranscriptionService.whisper';

/**
 * Services that are determined by the user's settings.
 */
export const userConfiguredServices = createServices();

function createServices() {
	const TranscriptionService = $derived.by(() => {
		switch (settings.value.selectedTranscriptionService) {
			case 'OpenAI':
				return createTranscriptionServiceWhisper({ HttpService });
			case 'Groq':
				return createTranscriptionServiceGroq({ HttpService });
			case 'faster-whisper-server':
				return createTranscriptionServiceFasterWhisperServer({ HttpService });
		}
	});

	const RecorderService = $derived(
		settings.value.selectedRecorderService === 'Tauri'
			? createRecorderServiceTauri()
			: createRecorderServiceWeb(),
	);

	return { TranscriptionService, RecorderService };
}

// Services that are not determined by the user's settings, but by the platform.

export const DownloadService = window.__TAURI_INTERNALS__
	? createDownloadServiceDesktop()
	: createDownloadServiceWeb();

export const HttpService = window.__TAURI_INTERNALS__
	? createHttpServiceDesktop()
	: createHttpServiceWeb();

export const NotificationService = window.__TAURI_INTERNALS__
	? NotificationServiceDesktopLive
	: NotificationServiceWebLive;

export const ClipboardService = window.__TAURI_INTERNALS__
	? createClipboardServiceDesktop()
	: createClipboardServiceWeb();

export const SetTrayIconService = window.__TAURI_INTERNALS__
	? createSetTrayIconDesktopService()
	: createSetTrayIconWebService();

export const RecordingsService = createRecordingsIndexedDbService();

import type { Settings } from '@repo/shared';
import {
	createSetTrayIconDesktopService,
	createSetTrayIconWebService,
} from './SetTrayIconService';
import { createClipboardServiceDesktop } from './clipboard/ClipboardService.desktop';
import { createClipboardServiceWeb } from './clipboard/ClipboardService.web';
import { createRecordingsIndexedDbService } from './db/RecordingsService.svelte.indexedDb';
import { createDownloadServiceDesktop } from './download/DownloadService.desktop';
import { createDownloadServiceWeb } from './download/DownloadService.web';
import { createHttpServiceDesktop } from './http/HttpService.desktop';
import { createHttpServiceWeb } from './http/HttpService.web';
import { NotificationServiceDesktopLive } from './notifications/NotificationService.desktop';
import { NotificationServiceWebLive } from './notifications/NotificationService.web';
import { createRecorderServiceWeb } from './recorder/RecorderService.web';
import { createTranscriptionServiceFasterWhisperServer } from './transcription/TranscriptionService.fasterWhisperServer';
import { createTranscriptionServiceGroq } from './transcription/TranscriptionService.groq';
import { createTranscriptionServiceWhisper } from './transcription/TranscriptionService.whisper';
import { createRecorderServiceTauri } from './recorder/RecorderService.tauri';

export const DownloadService = window.__TAURI_INTERNALS__
	? createDownloadServiceDesktop()
	: createDownloadServiceWeb();

export const HttpService = window.__TAURI_INTERNALS__
	? createHttpServiceDesktop()
	: createHttpServiceWeb();

export function createTranscriptionService(
	selectedTranscriptionService: Settings['selectedTranscriptionService'],
) {
	switch (selectedTranscriptionService) {
		case 'OpenAI':
			return createTranscriptionServiceWhisper({ HttpService });
		case 'Groq':
			return createTranscriptionServiceGroq({ HttpService });
		case 'faster-whisper-server':
			return createTranscriptionServiceFasterWhisperServer({ HttpService });
	}
}

export const NotificationService = window.__TAURI_INTERNALS__
	? NotificationServiceDesktopLive
	: NotificationServiceWebLive;

export const RecorderService = createRecorderServiceTauri();
// export const RecorderService = createRecorderServiceWeb();

export const ClipboardService = window.__TAURI_INTERNALS__
	? createClipboardServiceDesktop()
	: createClipboardServiceWeb();

export const SetTrayIconService = window.__TAURI_INTERNALS__
	? createSetTrayIconDesktopService()
	: createSetTrayIconWebService();

export const RecordingsService = createRecordingsIndexedDbService();

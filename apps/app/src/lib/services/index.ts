import type { Settings } from '@repo/shared';
import {
	createDownloadServiceDesktopLive,
	createDownloadServiceWebLive,
} from './DownloadService';
import { NotificationServiceDesktopLive } from './NotificationService.desktop';
import { NotificationServiceWebLive } from './NotificationService.web';
import {
	createSetTrayIconDesktopService,
	createSetTrayIconWebService,
} from './SetTrayIconService';
import { createClipboardServiceDesktopLive } from './clipboard/ClipboardServiceDesktopLive';
import { createClipboardServiceWebLive } from './clipboard/ClipboardServiceWebLive';
import { createRecordingsIndexedDbService } from './db/RecordingsIndexedDbService.svelte';
import { createHttpServiceDesktopLive } from './http/HttpService.desktop';
import { createHttpServiceWebLive } from './http/HttpService.web';
import { createRecorderServiceWeb } from './recorder/RecorderService.web';
import { createTranscriptionServiceFasterWhisperServerLive } from './transcription/TranscriptionService.fasterWhisperServer';
import { createTranscriptionServiceGroqLive } from './transcription/TranscriptionService.groq';
import { createTranscriptionServiceWhisperLive } from './transcription/TranscriptionService.whisper';

export const DownloadService = window.__TAURI_INTERNALS__
	? createDownloadServiceDesktopLive()
	: createDownloadServiceWebLive();

export const HttpService = window.__TAURI_INTERNALS__
	? createHttpServiceDesktopLive()
	: createHttpServiceWebLive();

export const createTranscriptionService = (
	selectedTranscriptionService: Settings['selectedTranscriptionService'],
) => {
	switch (selectedTranscriptionService) {
		case 'OpenAI':
			return createTranscriptionServiceWhisperLive({ HttpService });
		case 'Groq':
			return createTranscriptionServiceGroqLive({ HttpService });
		case 'faster-whisper-server':
			return createTranscriptionServiceFasterWhisperServerLive({ HttpService });
	}
};

export const NotificationService = window.__TAURI_INTERNALS__
	? NotificationServiceDesktopLive
	: NotificationServiceWebLive;

// export const RecorderService = createTauriRecorderService();
export const RecorderService = createRecorderServiceWeb();

export const ClipboardService = window.__TAURI_INTERNALS__
	? createClipboardServiceDesktopLive()
	: createClipboardServiceWebLive();

export const SetTrayIconService = window.__TAURI_INTERNALS__
	? createSetTrayIconDesktopService()
	: createSetTrayIconWebService();

export const RecordingsService = createRecordingsIndexedDbService();

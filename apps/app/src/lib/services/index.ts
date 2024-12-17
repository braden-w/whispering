import { Layer } from 'effect';
import { ClipboardServiceDesktopLive } from './ClipboardServiceDesktopLive';
import { ClipboardServiceWebLive } from './ClipboardServiceWebLive';
import { DownloadServiceDesktopLive } from './DownloadServiceDesktopLive';
import { DownloadServiceWebLive } from './DownloadServiceWebLive';
import { HttpServiceDesktopLive } from './HttpServiceDesktopLive';
import { HttpServiceWebLive } from './HttpServiceWebLive';
import { NotificationServiceDesktopLive } from './NotificationServiceDesktopLive';
import { NotificationServiceWebLive } from './NotificationServiceWebLive';
import { RecordingsDbServiceLiveIndexedDb } from './RecordingDbServiceIndexedDbLive.svelte';

export const MainLive = Layer.mergeAll(
	RecordingsDbServiceLiveIndexedDb,
	window.__TAURI_INTERNALS__
		? ClipboardServiceDesktopLive
		: ClipboardServiceWebLive,
	window.__TAURI_INTERNALS__
		? DownloadServiceDesktopLive
		: DownloadServiceWebLive,
	window.__TAURI_INTERNALS__
		? NotificationServiceDesktopLive
		: NotificationServiceWebLive,
	window.__TAURI_INTERNALS__ ? HttpServiceDesktopLive : HttpServiceWebLive,
);

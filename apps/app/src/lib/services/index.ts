import { Layer } from 'effect';

import { ClipboardServiceDesktopLive } from './ClipboardServiceDesktopLive';
import { ClipboardServiceWebLive } from './ClipboardServiceWebLive';
import { DownloadServiceDesktopLive } from './DownloadServiceDesktopLive';
import { DownloadServiceWebLive } from './DownloadServiceWebLive';
import { NotificationServiceDesktopLive } from './NotificationServiceDesktopLive';
import { NotificationServiceWebLive } from './NotificationServiceWebLive';
import { RecordingsDbServiceLiveIndexedDb } from './RecordingDbServiceIndexedDbLive.svelte';
import { SetTrayIconServiceWebLive } from './SetTrayIconServiceWebLive';
import { SetTrayIconServiceDesktopLive } from './SetTrayIconServiceDesktopLive';
import { HttpServiceWebLive } from './HttpServiceWebLive';
import { HttpServiceDesktopLive } from './HttpServiceDesktopLive';

export const MainLive = Layer.mergeAll(
	RecordingsDbServiceLiveIndexedDb,
	window.__TAURI_INTERNALS__ ? ClipboardServiceDesktopLive : ClipboardServiceWebLive,
	window.__TAURI_INTERNALS__ ? DownloadServiceDesktopLive : DownloadServiceWebLive,
	window.__TAURI_INTERNALS__ ? NotificationServiceDesktopLive : NotificationServiceWebLive,
	window.__TAURI_INTERNALS__ ? SetTrayIconServiceDesktopLive : SetTrayIconServiceWebLive,
	window.__TAURI_INTERNALS__ ? HttpServiceDesktopLive : HttpServiceWebLive,
);

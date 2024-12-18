import { Layer } from 'effect';
import { HttpServiceDesktopLive } from './HttpServiceDesktopLive';
import { HttpServiceWebLive } from './HttpServiceWebLive';
import { NotificationServiceDesktopLive } from './NotificationServiceDesktopLive';
import { NotificationServiceWebLive } from './NotificationServiceWebLive';

export const MainLive = Layer.mergeAll(
	window.__TAURI_INTERNALS__
		? NotificationServiceDesktopLive
		: NotificationServiceWebLive,
	window.__TAURI_INTERNALS__ ? HttpServiceDesktopLive : HttpServiceWebLive,
);

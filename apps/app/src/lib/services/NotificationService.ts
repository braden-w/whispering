import type { ToastAndNotifyOptions, WhisperingResult } from '@repo/shared';
import { NotificationServiceDesktopLive } from './NotificationServiceDesktopLive';
import { NotificationServiceWebLive } from './NotificationServiceWebLive';

export type NotificationService = {
	notify: (options: ToastAndNotifyOptions) => Promise<WhisperingResult<string>>;
	clear: (
		id: string,
	) => Promise<WhisperingResult<void>> | WhisperingResult<void>;
};

export const NotificationService = window.__TAURI_INTERNALS__
	? NotificationServiceDesktopLive
	: NotificationServiceWebLive;

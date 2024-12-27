import type { ToastAndNotifyOptions, WhisperingResult } from '@repo/shared';

export type NotificationService = {
	notify: (options: ToastAndNotifyOptions) => Promise<WhisperingResult<string>>;
	clear: (
		id: string,
	) => Promise<WhisperingResult<void>> | WhisperingResult<void>;
};

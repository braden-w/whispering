import { type Result, createServiceErrorFns } from '@epicenterhq/result';
import type { ToastOptions } from './services/ToastAndNotificationService.js';

export type WhisperingErrProperties = {
	_tag: 'WhisperingError';
	isWarning?: boolean;
} & ToastOptions;

export type WhisperingResult<T> = Result<T, WhisperingErrProperties>;

const {
	Err: WhisperingErr,
	trySync: trySyncWhispering,
	tryAsync: tryAsyncWhispering,
} = createServiceErrorFns<WhisperingErrProperties>();
export { WhisperingErr, tryAsyncWhispering, trySyncWhispering };

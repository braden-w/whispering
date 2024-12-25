import { Err, type Result } from '@epicenterhq/result';
import type { ToastAndNotifyOptions } from './services/ToastAndNotificationService.js';

export type WhisperingErrProperties = {
	_tag: 'WhisperingError';
} & ToastAndNotifyOptions;

export type WhisperingResult<T> = Result<T, WhisperingErrProperties>;

export type MaybePromise<T> = T | Promise<T>;

export const WhisperingWarning = (
	args: Omit<WhisperingErrProperties, '_tag' | 'variant'>,
): WhisperingResult<never> => {
	return Err({
		_tag: 'WhisperingError',
		variant: 'warning',
		...args,
	} satisfies WhisperingErrProperties);
};

export const WhisperingErr = (
	args: Omit<WhisperingErrProperties, '_tag' | 'variant'>,
): WhisperingResult<never> =>
	Err({
		_tag: 'WhisperingError',
		variant: 'error',
		...args,
	} satisfies WhisperingErrProperties);

import { Err, type Result } from '@epicenterhq/result';
import type { ToastAndNotifyOptions } from './services/ToastAndNotificationService.js';

export type WhisperingErrProperties = {
	_tag: 'WhisperingError';
} & ToastAndNotifyOptions;

export type WhisperingResult<T> = Result<T, WhisperingErrProperties>;

export const WhisperingWarning = (
	args: Pick<WhisperingErrProperties, 'title' | 'description' | 'action'>,
): WhisperingResult<never> => {
	return Err({
		_tag: 'WhisperingError',
		variant: 'warning',
		...args,
	} satisfies WhisperingErrProperties);
};

export const WhisperingErr = (
	args: Pick<WhisperingErrProperties, 'title' | 'description' | 'action'>,
): WhisperingResult<never> => {
	return Err({
		_tag: 'WhisperingError',
		variant: 'error',
		...args,
	} satisfies WhisperingErrProperties);
};

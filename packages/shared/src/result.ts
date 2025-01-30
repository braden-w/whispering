import { Err, type Ok } from '@epicenterhq/result';
import type { ToastAndNotifyOptions } from './toasts.js';

export type WhisperingErrProperties = {
	_tag: 'WhisperingError';
	variant: 'error' | 'warning';
} & Omit<ToastAndNotifyOptions, 'variant'>;

export type WhisperingErr = Err<WhisperingErrProperties>;
export type WhisperingResult<T> = Ok<T> | WhisperingErr;

export type MaybePromise<T> = T | Promise<T>;

export const WhisperingWarning = (
	args: Omit<WhisperingErrProperties, '_tag' | 'variant'>,
): WhisperingErr =>
	Err({
		_tag: 'WhisperingError',
		variant: 'warning',
		...args,
	} satisfies WhisperingErrProperties);

export const WhisperingErr = (
	args: Omit<WhisperingErrProperties, '_tag' | 'variant'>,
): WhisperingErr =>
	Err({
		_tag: 'WhisperingError',
		variant: 'error',
		...args,
	} satisfies WhisperingErrProperties);

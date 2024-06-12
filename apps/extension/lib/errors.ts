import { ToastService, type WhisperingErrorProperties } from '@repo/shared';
import { Cause, Data, Effect } from 'effect';
import { ToastServiceLive } from './services/ToastServiceLive';

export class BackgroundServiceWorkerError extends Data.TaggedError(
	'BackgroundServiceWorkerError',
)<WhisperingErrorProperties> {}

export const renderErrorAsToast = <
	E extends Cause.YieldableError & Readonly<WhisperingErrorProperties>,
>(
	error: E,
	options?: { toastId?: number | string },
) =>
	Effect.gen(function* () {
		const toast = yield* ToastService;
		toast.error({
			id: options?.toastId,
			title: error.title,
			description: error.description,
			action: error.action,
		});
		return yield* error;
	}).pipe(Effect.provide(ToastServiceLive));

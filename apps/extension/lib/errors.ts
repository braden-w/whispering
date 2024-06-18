import { ToastService, WhisperingError } from '@repo/shared';
import { Console, Effect } from 'effect';
import { ToastServiceCsLive } from './services/ToastServiceCsLive';
import { ToastServiceBgswLive } from './services/ToastServiceBgswLive';

export const renderErrorAsToast =
	(context: 'bgsw' | 'content') =>
	(error: WhisperingError, options?: { toastId?: number | string }) =>
		Effect.gen(function* () {
			const { toast } = yield* ToastService;
			toast({
				variant: 'error',
				id: options?.toastId,
				title: error.title,
				description: error.description,
				action: error.action,
			});
			yield* Console.error({ ...error });
			return yield* error;
		}).pipe(Effect.provide(context === 'bgsw' ? ToastServiceBgswLive : ToastServiceCsLive));

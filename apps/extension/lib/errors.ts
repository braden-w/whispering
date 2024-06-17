import { ToastService, WhisperingError } from '@repo/shared';
import { Console, Effect } from 'effect';
import { ToastServiceLive } from './services/ToastServiceLive';

export const renderErrorAsToast = (
	error: WhisperingError,
	options?: { toastId?: number | string },
) =>
	Effect.gen(function* () {
		const { toast } = yield* ToastService;
		toast({
			variant: 'error',
			id: options?.toastId,
			title: error.title,
			description: error.description,
			action: error.action,
		});
		yield* Console.error(error.error instanceof Error ? error.error.message : error.error);
		return yield* error;
	}).pipe(Effect.provide(ToastServiceLive));

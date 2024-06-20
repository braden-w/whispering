import { ToastService, WhisperingError } from '@repo/shared';
import { Console, Effect } from 'effect';
import { ToastServiceLive } from './ToastServiceLive';

export const renderErrorAsToast = (error: WhisperingError, options?: { toastId?: string }) =>
	Effect.gen(function* () {
		const { toast } = yield* ToastService;
		yield* toast({
			variant: 'error',
			id: options?.toastId,
			title: error.title,
			description: error.description,
			action: error.action,
		});
		yield* Console.error({ ...error });
	}).pipe(Effect.provide(ToastServiceLive));

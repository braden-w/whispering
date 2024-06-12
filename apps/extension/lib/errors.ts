import { ToastService, type WhisperingErrorProperties } from '@repo/shared';
import { Console, Data, Effect } from 'effect';
import type { YieldableError } from 'effect/Cause';
import { ToastServiceLive } from './services/ToastServiceLive';

export class WhisperingError extends Data.TaggedError(
	'WhisperingError',
)<WhisperingErrorProperties> {}

export const renderErrorAsToast = <E extends YieldableError & Readonly<WhisperingError>>(
	error: E,
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
	}).pipe(Effect.provide(ToastServiceLive));

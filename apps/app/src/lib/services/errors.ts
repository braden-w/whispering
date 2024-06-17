import { ToastService, type WhisperingErrorProperties } from '@repo/shared';
import { Console, Effect } from 'effect';
import type { YieldableError } from 'effect/Cause';
import { ToastServiceDesktopLive } from './ToastServiceDesktopLive';
import { ToastServiceWebLive } from './ToastServiceWebLive';

export const renderErrorAsToast = <E extends YieldableError & Readonly<WhisperingErrorProperties>>(
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
		return yield* error;
	}).pipe(Effect.provide(window.__TAURI__ ? ToastServiceDesktopLive : ToastServiceWebLive));

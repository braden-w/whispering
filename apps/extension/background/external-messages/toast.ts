import type { ToastOptions } from '@repo/shared';
import { ToastService } from '@repo/shared';
import { Effect } from 'effect';
import { ToastServiceBgswLive } from '~lib/services/ToastServiceBgswLive';

export const toast = (toastOptions: ToastOptions) =>
	Effect.gen(function* () {
		const { toast } = yield* ToastService;
		return toast(toastOptions);
	}).pipe(Effect.provide(ToastServiceBgswLive));

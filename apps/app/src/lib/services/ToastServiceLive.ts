import { sendMessageToExtension } from '$lib/messaging';
import { ToastService } from '@repo/shared';
import { Effect, Layer } from 'effect';
import { toast } from 'svelte-sonner';

export const ToastServiceLive = Layer.succeed(
	ToastService,
	ToastService.of({
		toast: ({ variant, title, ...args }) => {
			const toastId = toast[variant](title, args);
			sendMessageToExtension({
				message: 'toast',
				toastOptions: {
					variant,
					title,
					...args,
				},
			}).pipe(Effect.runPromise);
			return toastId;
		},
	}),
);

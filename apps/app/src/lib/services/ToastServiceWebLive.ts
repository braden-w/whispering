import { goto } from '$app/navigation';
import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { ToastService, type ToastOptions } from '@repo/shared';
import { Console, Effect, Layer } from 'effect';
import { nanoid } from 'nanoid/non-secure';
import { toast } from 'svelte-sonner';


export const ToastServiceWebLive = Layer.succeed(
	ToastService,
	ToastService.of({
		toast: (toastOptions) => Effect.gen(function* () {
			const { variant, id, title, description, descriptionClass, action } = toastOptions;
			const toastId = toast[variant](title, {
				id,
				description,
				descriptionClass,
				action: action && {
					label: action.label,
					onClick: () => goto(action.goto),
				},
			});
			yield* sendMessageToExtension({
				name: 'external/toast',
				body: { toastOptions },
			});
			return toastId;
		}).pipe(
			Effect.tapError((error) => Console.error({ ...error })),
			Effect.catchAll(() => Effect.succeed(toastOptions.id ?? nanoid()))
		),
	}),
);

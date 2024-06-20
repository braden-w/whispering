import { goto } from '$app/navigation';
import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { ToastService } from '@repo/shared';
import { Effect, Layer } from 'effect';
import { toast } from 'svelte-sonner';

export const ToastServiceWebLive = Layer.succeed(
	ToastService,
	ToastService.of({
		toast: ({ variant, id, title, description, descriptionClass, action }) =>
			Effect.gen(function* () {
				const toastId = toast[variant](title, {
					id,
					description,
					descriptionClass,
					action: action && {
						label: action.label,
						onClick: () => goto(action.goto),
					},
				});
				sendMessageToExtension({
					name: 'external/toast',
					body: {
						toastOptions: {
							variant,
							id,
							title,
							description,
							descriptionClass,
							action,
						},
					},
				});
				return toastId;
			}),
	}),
);

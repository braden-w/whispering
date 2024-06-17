import { goto } from '$app/navigation';
import { extensionCommands } from '$lib/messaging';
import { ToastService } from '@repo/shared';
import { Effect, Layer } from 'effect';
import { toast } from 'svelte-sonner';

export const ToastServiceLive = Layer.succeed(
	ToastService,
	ToastService.of({
		toast: ({ variant, id, title, description, descriptionClass, action }) => {
			const toastId = toast[variant](title, {
				id,
				description,
				descriptionClass,
				action: action && {
					label: action.label,
					onClick: () => goto(action.goto),
				},
			});
			const sendToast = extensionCommands.toast({
				variant,
				id,
				title,
				description,
				descriptionClass,
				action,
			});
			sendToast.pipe(Effect.runPromise);
			return toastId;
		},
	}),
);

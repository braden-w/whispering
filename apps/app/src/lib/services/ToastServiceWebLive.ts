import { goto } from '$app/navigation';
import { extensionCommands } from '$lib/extensionCommands';
import { ToastService } from '@repo/shared';
import { Effect, Layer } from 'effect';
import { toast } from 'svelte-sonner';

export const ToastServiceWebLive = Layer.succeed(
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
			extensionCommands
				.toast({
					variant,
					id,
					title,
					description,
					descriptionClass,
					action,
				})
				.pipe(Effect.runPromise);
			return toastId;
		},
	}),
);

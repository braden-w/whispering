import { goto } from '$app/navigation';
import { ToastService } from '@repo/shared';
import { Effect, Layer } from 'effect';
import { toast } from 'svelte-sonner';

export const ToastServiceDesktopLive = Layer.succeed(
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
				return toastId;
			}),
	}),
);

import { goto } from '$app/navigation';
import { ToastService } from '@repo/shared';
import { Effect, Layer } from 'effect';
import { toast } from 'svelte-sonner';

export const ToastServiceLive = Layer.succeed(
	ToastService,
	ToastService.of({
		toast: ({ variant, id: maybeId, title, description, descriptionClass, action }) =>
			Effect.gen(function* () {
				const toastId = toast[variant](title, {
					id: maybeId,
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

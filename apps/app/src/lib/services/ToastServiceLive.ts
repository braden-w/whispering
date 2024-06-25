import { ToastService } from '$lib/services/ToastService';
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
					action,
				});
				return String(toastId);
			}),
	}),
);

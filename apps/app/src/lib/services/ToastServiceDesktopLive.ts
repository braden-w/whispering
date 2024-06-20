import { goto } from '$app/navigation';
import { ToastService } from '@repo/shared';
import { Console, Effect, Layer } from 'effect';
import { nanoid } from 'nanoid/non-secure';
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
			}).pipe(
				// Effect.tapError((error) => Console.error({ ...error })),
				Effect.catchAll(() => Effect.succeed(id ?? nanoid())),
			),
	}),
);

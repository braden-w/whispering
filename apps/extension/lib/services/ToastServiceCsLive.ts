import { ToastService } from '@repo/shared';
import { Effect, Layer } from 'effect';
import { toast } from 'sonner';

export const ToastServiceCsLive = Layer.succeed(
	ToastService,
	ToastService.of({
		toast: ({ variant, id, title, description, descriptionClass, action }) =>
			Effect.gen(function* () {
				const toastId = toast[variant](title, {
					id,
					description,
					descriptionClassName: descriptionClass,
					action: action && {
						label: action.label,
						onClick: () => {
							window.open(action.goto, '_blank');
						},
					},
				});
				return toastId;
			}),
	}),
);

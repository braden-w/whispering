import { goto } from '$app/navigation';
import { toast } from '$lib/services/ToastService';
import { WhisperingError } from '@repo/shared';
import { Console, Effect } from 'effect';

export const renderErrorAsToast = (
	{ variant, title, description, action, ...restError }: WhisperingError,
	options?: { toastId?: string },
) =>
	Effect.gen(function* () {
		yield* toast({
			variant: variant,
			id: options?.toastId,
			title: title,
			description: description,
			action: action && {
				label: action.label,
				onClick: () => {
					if (action) goto(action.goto);
				},
			},
		});
		yield* Console.error({ variant, title, description, action, ...restError });
	});

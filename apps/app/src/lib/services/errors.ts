import { goto } from '$app/navigation';
import { ToastService } from '$lib/services/ToastService';
import { WhisperingError } from '@repo/shared';
import { Console, Effect } from 'effect';
import { ToastServiceLive } from './ToastServiceLive';

export const renderErrorAsToast = (
	{ variant, title, description, action, ...restError }: WhisperingError,
	options?: { toastId?: string },
) =>
	Effect.gen(function* () {
		const { toast } = yield* ToastService;
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
	}).pipe(Effect.provide(ToastServiceLive));

import { goto } from '$app/navigation';
import { toast } from '$lib/services/ToastService';
import type { WhisperingError } from '@repo/shared';
import { Console, Effect } from 'effect';

export const renderErrorAsToast = (
	whisperingError: WhisperingError,
	options?: { toastId?: string },
) =>
	Effect.gen(function* () {
		const { isWarning, title, description, action } = whisperingError;
		yield* toast({
			variant: isWarning ? 'warning' : 'error',
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
		yield* Console.error(whisperingError);
	});

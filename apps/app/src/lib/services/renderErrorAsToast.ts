import { goto } from '$app/navigation';
import { errorMoreDetailsDialog } from '$lib/components/MoreDetailsDialog.svelte';
import { toast } from '$lib/services/ToastService';
import type { WhisperingError } from '@repo/shared';
import { Console, Effect } from 'effect';

export const renderErrorAsToast = (
	whisperingError: WhisperingError,
	options?: { toastId?: string },
) =>
	Effect.gen(function* () {
		const { isWarning, title, description, action } = whisperingError;
		const getAction = () => {
			switch (action?.type) {
				case 'link':
					return {
						label: action.label,
						onClick: () => goto(action.goto),
					};
				case 'more-details':
					return {
						label: 'More details',
						onClick: () => errorMoreDetailsDialog.openWithError(action.error),
					};
				default:
					return undefined;
			}
		};
		toast({
			variant: isWarning ? 'warning' : 'error',
			id: options?.toastId,
			title: title,
			description: description,
			action: getAction(),
		});
		yield* Console.error(whisperingError);
	});

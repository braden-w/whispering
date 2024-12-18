import { goto } from '$app/navigation';
import { errorMoreDetailsDialog } from '$lib/components/MoreDetailsDialog.svelte';
import { toast } from '$lib/services/ToastService';
import type { WhisperingResult, WhisperingError } from '@repo/shared';

export const renderErrAsToast = <T, E extends WhisperingError>(
	result: WhisperingResult<T, E>,
	options?: { toastId?: string },
) => {
	if (result.ok) return;
	const { isWarning, title, description, action } = result.error;
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
	console.error(result.error);
};

import { goto } from '$app/navigation';
import { errorMoreDetailsDialog } from '$lib/components/MoreDetailsDialog.svelte';
import { toast } from '$lib/services/ToastService';
import type { Err, WhisperingErrorProperties } from '@repo/shared';

export const renderErrAsToast = <E extends WhisperingErrorProperties>(
	err: Err<E>,
	options?: { toastId?: string },
) => {
	const { isWarning, title, description, action } = err.error;
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
	console.error(err);
};

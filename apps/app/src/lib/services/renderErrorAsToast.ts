import { goto } from '$app/navigation';
import { errorMoreDetailsDialog } from '$lib/components/MoreDetailsDialog.svelte';
import { toast } from '$lib/services/ToastService';
import type { WhisperingErrProperties } from '@repo/shared';

export const renderErrAsToast = (
	errProperties: WhisperingErrProperties,
	options?: { toastId?: string },
) => {
	const { isWarning, title, description, action } = errProperties;
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
	const variant = isWarning ? 'warning' : 'error';
	toast[variant]({
		id: options?.toastId,
		title: title,
		description: description,
		action: getAction(),
	});
	console.error(errProperties);
};

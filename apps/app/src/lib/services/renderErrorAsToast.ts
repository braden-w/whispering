import { toast } from '$lib/services/ToastService';
import type { WhisperingErrProperties } from '@repo/shared';

export const renderErrAsToast = (errProperties: WhisperingErrProperties) => {
	const { isWarning, ...toastOptions } = errProperties;
	const variant = isWarning ? 'warning' : 'error';
	toast[variant](toastOptions);
	console.error(errProperties);
};

import { toast } from '$lib/services/ToastService';
import type { ToastAndNotifyOptions } from '@repo/shared';

export const renderErrAsToast = (errProperties: ToastAndNotifyOptions) => {
	const { variant, ...toastOptions } = errProperties;
	toast[variant](toastOptions);
	console.error(errProperties);
};

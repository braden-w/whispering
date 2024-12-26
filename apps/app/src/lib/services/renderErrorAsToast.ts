import { toast } from '$lib/services/ToastService';
import type { ToastAndNotifyOptions } from '@repo/shared';

export const renderErrAsToast = ({
	variant = 'error',
	...toastOptions
}: Omit<ToastAndNotifyOptions, 'variant'> & {
	variant?: ToastAndNotifyOptions['variant'];
}) => {
	toast[variant](toastOptions);
	console.error(toastOptions);
};

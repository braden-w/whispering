import { dev } from '$app/environment';
import { goto } from '$app/navigation';
import { errorMoreDetailsDialog } from '$lib/components/MoreDetailsDialog.svelte';
import { NotificationService } from '$lib/services.svelte';
import { extension } from '@repo/extension';
import type { ToastAndNotifyOptions } from '@repo/shared';
import { toast as sonnerToast } from 'svelte-sonner';

export const toast = createToastService();

function createToastService() {
	const createToastFn =
		(toastVariant: ToastAndNotifyOptions['variant']) =>
		(toastOptions: Omit<ToastAndNotifyOptions, 'variant'>) => {
			if (toastVariant === 'error') {
				void extension.openWhisperingTab({});
			}

			const notificationResult = NotificationService.notify({
				variant: toastVariant,
				...toastOptions,
			}).then((result) => {
				console.log('🚀 ~ createToastService ~ notificationResult:', result);
			});

			const getDurationInMs = () => {
				if (toastVariant === 'loading') return 5000;
				if (toastVariant === 'error' || toastVariant === 'warning') return 5000;
				if (toastOptions.action) return 4000;
				return 3000;
			};

			const durationInMs = getDurationInMs();

			if (dev) {
				switch (toastVariant) {
					case 'error':
						console.error('[Toast]', toastOptions);
						break;
					case 'warning':
						console.warn('[Toast]', toastOptions);
						break;
					case 'info':
						console.info('[Toast]', toastOptions);
						break;
					case 'loading':
						console.info('[Toast]', toastOptions);
						break;
					case 'success':
						console.log('[Toast]', toastOptions);
						break;
				}
			}

			const { title, action, ...options } = toastOptions;
			const id = sonnerToast[toastVariant](title, {
				...options,
				duration: durationInMs,
				action: convertActionToToastAction(action),
			});
			return String(id);
		};

	return {
		success: createToastFn('success'),
		info: createToastFn('info'),
		loading: createToastFn('loading'),
		error: createToastFn('error'),
		warning: createToastFn('warning'),
		dismiss: sonnerToast.dismiss,
	};
}

function convertActionToToastAction(action: ToastAndNotifyOptions['action']) {
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
}

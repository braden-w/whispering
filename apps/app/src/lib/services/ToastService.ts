import { toast as sonnerToast, type ExternalToast } from 'svelte-sonner';

type ToastVariant = 'success' | 'info' | 'loading' | 'error' | 'warning';
type ToastOptions = { id?: string; title: string } & Pick<
	ExternalToast,
	'description' | 'descriptionClass' | 'action'
>;

export const toast = createToastService();

function createToastService() {
	const createToastFn =
		(variant: ToastVariant) =>
		({ title, ...options }: ToastOptions) => {
			const getDurationInMs = () => {
				if (variant === 'loading') return 60_000;
				if (variant === 'error' || variant === 'warning') return 5000;
				if (options.action) return 4000;
				return 3000;
			};
			const durationInMs = getDurationInMs();

			const id = sonnerToast[variant](title, {
				...options,
				duration: durationInMs,
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

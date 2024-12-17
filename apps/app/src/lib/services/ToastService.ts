import { Effect } from 'effect';
import { toast as sonnerToast } from 'svelte-sonner';

type ToastOptions = {
	variant: 'success' | 'info' | 'loading' | 'error' | 'warning';
	id?: string | undefined;
	title: string;
	description: string;
	descriptionClass?: string;
	action?:
		| {
				label: string;
				onClick: (event: MouseEvent) => void;
		  }
		| undefined;
};

export const toast = ({
	variant,
	id: maybeId,
	title,
	description,
	descriptionClass,
	action,
}: ToastOptions) => {
	const durationInMs = (() => {
		if (variant === 'loading') return Number.POSITIVE_INFINITY;
		if (variant === 'error' || variant === 'warning') return 5000;
		if (action) return 4000;
		return 3000;
	})();
	const toastId = sonnerToast[variant](title, {
		duration: durationInMs,
		id: maybeId,
		description,
		descriptionClass,
		action,
	});
	return String(toastId);
};

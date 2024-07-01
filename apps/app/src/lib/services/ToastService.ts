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
}: ToastOptions) =>
	Effect.gen(function* () {
		const toastId = sonnerToast[variant](title, {
			id: maybeId,
			description,
			descriptionClass,
			action,
		});
		return String(toastId);
	});

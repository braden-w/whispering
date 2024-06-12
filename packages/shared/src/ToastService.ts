import type { Effect } from 'effect';
import { Context } from 'effect';

type ToastId = string | number;

export class ToastService extends Context.Tag('ToastService')<
	ToastService,
	{
		success: (options: {
			id?: ToastId;
			title: string;
			description: string;
			descriptionClass?: string;
			action?: {
				label: string;
				onClick: () => void;
			};
		}) => ToastId;
		loading: (options: {
			id?: ToastId;
			title: string;
			description: string;
			descriptionClass?: string;
			action?: {
				label: string;
				onClick: () => void;
			};
		}) => ToastId;
		error: (options: {
			id?: ToastId;
			title: string;
			description?: string;
			descriptionClass?: string;
			action?: {
				label: string;
				onClick: () => void;
			};
		}) => ToastId;
	}
>() {}

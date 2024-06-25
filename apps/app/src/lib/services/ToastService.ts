import type { Effect } from 'effect';
import { Context } from 'effect';

export type ToastOptions = {
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

export class ToastService extends Context.Tag('ToastService')<
	ToastService,
	{
		toast: (options: ToastOptions) => Effect.Effect<string>;
	}
>() {}

import { Context } from 'effect';
import { z } from 'zod';

const toastIdSchema = z.union([z.string(), z.number()]);
type ToastId = z.infer<typeof toastIdSchema>;

export const toastOptionsSchema = z.object({
	variant: z.enum(['success', 'info', 'loading', 'error']),
	id: toastIdSchema.optional(),
	title: z.string(),
	description: z.string(),
	descriptionClass: z.string().optional(),
	action: z
		.object({
			label: z.string(),
			onClick: z.function(z.tuple([]), z.void()),
		})
		.optional(),
});

type ToastOptions = z.infer<typeof toastOptionsSchema>;

export class ToastService extends Context.Tag('ToastService')<
	ToastService,
	{
		toast: (options: ToastOptions) => ToastId;
	}
>() {}

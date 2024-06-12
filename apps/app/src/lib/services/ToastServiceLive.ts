import { ToastService } from '@repo/shared';
import { Layer } from 'effect';
import { toast } from 'svelte-sonner';

export const ToastServiceLive = Layer.succeed(
	ToastService,
	ToastService.of({
		success: ({ title, ...args }) => toast.success(title, args),
		info: ({ title, ...args }) => toast.info(title, args),
		loading: ({ title, ...args }) => toast.loading(title, args),
		error: ({ title, ...args }) => toast.error(title, args),
	}),
);

import { ToastService } from '@repo/shared';
import { Layer } from 'effect';
import { nanoid } from 'nanoid';
import { extensionStorage } from './extension-storage';

export const ToastServiceLive = Layer.succeed(
	ToastService,
	ToastService.of({
		success: ({ id: maybeId, ...args }) => {
			const id = maybeId ?? nanoid();
			extensionStorage.set({
				key: 'whispering-toast',
				value: { id, variant: 'success', ...args },
			});
			return id;
		},
		info: ({ id: maybeId, ...args }) => {
			const id = maybeId ?? nanoid();
			extensionStorage.set({
				key: 'whispering-toast',
				value: { id, variant: 'info', ...args },
			});
			return id;
		},
		loading: ({ id: maybeId, ...args }) => {
			const id = maybeId ?? nanoid();
			extensionStorage.set({
				key: 'whispering-toast',
				value: { id, variant: 'loading', ...args },
			});
			return id;
		},
		error: ({ id: maybeId, ...args }) => {
			const id = maybeId ?? nanoid();
			extensionStorage.set({
				key: 'whispering-toast',
				value: { id, variant: 'error', ...args },
			});
			return id;
		},
	}),
);

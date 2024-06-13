import { ToastService } from '@repo/shared';
import { Layer } from 'effect';
import { nanoid } from 'nanoid/non-secure';
import { extensionStorage } from './extension-storage';

export const ToastServiceLive = Layer.succeed(
	ToastService,
	ToastService.of({
		toast: ({ id: maybeId, ...args }) => {
			const id = maybeId ?? nanoid();
			extensionStorage.set({
				key: 'whispering-toast',
				value: { id, ...args },
			});
			return id;
		},
	}),
);

import { ToastService } from '@repo/shared';
import { Layer } from 'effect';
import { nanoid } from 'nanoid/non-secure';
import { extensionStorageService } from './extension-storage';

export const ToastServiceBgswLive = Layer.succeed(
	ToastService,
	ToastService.of({
		toast: ({ variant, id: maybeId, title, description, descriptionClass, action }) => {
			const id = maybeId ?? nanoid();
			extensionStorageService['whispering-toast'].set({
				variant,
				id,
				title,
				description,
				descriptionClass,
				action,
			});
			return id;
		},
	}),
);

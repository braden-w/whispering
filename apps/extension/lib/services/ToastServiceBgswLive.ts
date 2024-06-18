import { ToastService } from '@repo/shared';
import { Effect, Layer } from 'effect';
import { nanoid } from 'nanoid/non-secure';

export const ToastServiceBgswLive = Layer.succeed(
	ToastService,
	ToastService.of({
		toast: ({ variant, id: maybeId, title, description, descriptionClass, action }) =>
			Effect.gen(function* () {
				const id = maybeId ?? nanoid();
				chrome.notifications.create(id, {
					title,
					message: description,
					type: 'basic',
					buttons: action ? [{ title: action.label }] : undefined,
				});
				if (action) {
					chrome.notifications.onButtonClicked.addListener((id, buttonIndex) => {
						if (buttonIndex === 0) {
							chrome.notifications.clear(id);
							chrome.tabs.create({ url: action.goto });
						}
					});
				}

				return id;
			}),
	}),
);

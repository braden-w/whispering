import { ToastService } from '@repo/shared';
import { Effect, Layer } from 'effect';
import { nanoid } from 'nanoid/non-secure';

export const ToastServiceBgswLive = Layer.succeed(
	ToastService,
	ToastService.of({
		toast: ({ variant, id: maybeId, title, description, descriptionClass, action }) =>
			Effect.gen(function* () {
				const id = maybeId ?? nanoid();
				if (!action) {
					chrome.notifications.create(id, {
						title,
						message: description,
						type: 'basic',
					});
				} else {
					chrome.notifications.create(id, {
						title,
						message: description,
						type: 'basic',
						buttons: [{ title: action.label }],
					});
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

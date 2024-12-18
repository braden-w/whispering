import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
import {
	NotificationService,
	WHISPERING_URL,
	WhisperingError,
} from '@repo/shared';
import { Console, Effect, Layer } from 'effect';
import { nanoid } from 'nanoid/non-secure';
import { injectScript } from '~background/injectScript';
import { getOrCreateWhisperingTabId } from '~lib/getOrCreateWhisperingTabId';

export const NotificationServiceBgswLive = Layer.succeed(
	NotificationService,
	NotificationService.of({
		notify: ({ id: maybeId, title, description, action }) =>
			Effect.gen(function* () {
				const id = maybeId ?? nanoid();

				yield* Effect.tryPromise({
					try: async () => {
						if (!action) {
							chrome.notifications.create(id, {
								priority: 2,
								requireInteraction: true,
								title,
								message: description,
								type: 'basic',
								iconUrl: studioMicrophone,
							});
						} else {
							chrome.notifications.create(id, {
								priority: 2,
								title,
								message: description,
								type: 'basic',
								buttons: [{ title: action.label }],
								iconUrl: studioMicrophone,
							});

							const gotoTargetUrlInWhisperingTab = Effect.gen(function* () {
								const whisperingTabId = yield* getOrCreateWhisperingTabId;
								yield* injectScript<undefined, [string]>({
									tabId: whisperingTabId,
									commandName: 'goto',
									func: (route) => {
										try {
											window.goto(route);
											return { ok: true, data: undefined } as const;
										} catch (error) {
											return {
												ok: false,
												error: {
													title: `Unable to go to route ${route} in Whispering tab`,
													description:
														'There was an error going to the route in the Whispering tab.',
													action: {
														type: 'more-details',
														error,
													},
												},
											} as const;
										}
									},
									args: [action.goto],
								});
								yield* Effect.promise(() =>
									chrome.tabs.update(whisperingTabId, { active: true }),
								);
							});

							chrome.notifications.onClicked.addListener((clickedId) =>
								Effect.gen(function* () {
									if (clickedId === id) {
										chrome.notifications.clear(id);
										yield* gotoTargetUrlInWhisperingTab;
									}
								}).pipe(Effect.runPromise),
							);
							chrome.notifications.onButtonClicked.addListener(
								(id, buttonIndex) =>
									Effect.gen(function* () {
										if (buttonIndex === 0) {
											chrome.notifications.clear(id);
											yield* gotoTargetUrlInWhisperingTab;
										}
									}).pipe(Effect.runPromise),
							);
						}
					},
					catch: (error) => ({
						_tag: 'WhisperingError',
						title: 'Failed to show notification',
						description:
							'There was an error showing the notification in the background service worker.',
						action: {
							type: 'more-details',
							error,
						},
					}),
				}).pipe(
					Effect.tapError((error) => Console.error({ ...error })),
					Effect.catchAll(() => Effect.succeed(maybeId ?? nanoid())),
				);

				return id;
			}),
		clear: (id: string) => Effect.sync(() => chrome.notifications.clear(id)),
	}),
);

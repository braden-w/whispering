import { Console, Effect, Option } from 'effect';
import { NoSuchElementException } from 'effect/Cause';
import type { WhisperingMessage } from '~contents/whispering';

export const getWhisperingTabId = Effect.gen(function* () {
	const tabs = yield* Effect.promise(() => chrome.tabs.query({ url: 'http://localhost:5173/*' }));
	if (tabs.length === 0) {
		const newTab = yield* Effect.promise(() =>
			chrome.tabs.create({
				url: 'http://localhost:5173',
				active: false,
				pinned: true,
			}),
		);
		return newTab.id;
	}
	const { id: selectedTabId, discarded: isSelectedTabDiscarded } =
		tabs.find((tab) => tab.pinned) ?? tabs[0];
	if (!selectedTabId) {
		return yield* new NoSuchElementException();
	}
	if (isSelectedTabDiscarded) {
		return yield* Effect.async<number>((resume) => {
			chrome.tabs.reload(selectedTabId);
			chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo) {
				if (updatedTabId === selectedTabId && changeInfo.status === 'complete') {
					resume(Effect.succeed(selectedTabId));
					chrome.tabs.onUpdated.removeListener(listener);
				}
			});
		});
	}
	return selectedTabId;
}).pipe(Effect.flatMap(Option.fromNullable));

export const sendMessageToWhisperingContentScript = <R>(message: WhisperingMessage) =>
	Effect.gen(function* () {
		const whisperingTabId = yield* getWhisperingTabId;
		yield* Console.info('Whispering tab ID:', whisperingTabId);
		yield* Console.info('Sending message to Whispering content script:', message);
		const response = yield* Effect.promise(() =>
			chrome.tabs.sendMessage<WhisperingMessage, R>(whisperingTabId, message),
		);
		yield* Console.info('Response from Whispering content script:', response);
		return response;
	});

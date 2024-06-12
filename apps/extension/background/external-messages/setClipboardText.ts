import { Console, Effect } from 'effect';
import { BackgroundServiceWorkerError } from '~lib/errors';

const getCurrentTabId = Effect.gen(function* () {
	const [currentTab] = yield* Effect.promise(() =>
		chrome.tabs.query({ active: true, currentWindow: true }),
	);
	if (!currentTab.id) {
		return yield* Effect.fail(new BackgroundServiceWorkerError({ title: 'No active tab found' }));
	}
	return currentTab.id;
});

const handler = (text: string) =>
	Effect.gen(function* () {
		const currentTabId = yield* getCurrentTabId;
		const [{ result }] = yield* Effect.tryPromise({
			try: () =>
				chrome.scripting.executeScript({
					target: { tabId: currentTabId },
					world: 'MAIN',
					func: (text: string) => {
						try {
							console.info('Setting clipboard text:', text);
							navigator.clipboard.writeText(text);
							console.info('Clipboard text set:', text);
							return { isSuccess: true, data: text } as const;
						} catch (error) {
							console.error('Error setting clipboard text:', error);
							return { isSuccess: false, error } as const;
						}
					},
					args: [text],
				}),
			catch: (error) =>
				new BackgroundServiceWorkerError({
					title: 'No result from setClipboardText',
					description: error instanceof Error ? error.message : undefined,
					error,
				}),
		});
		yield* Console.info('setClipboardText result:', result);
		if (!result || !result.isSuccess) {
			return yield* new BackgroundServiceWorkerError({
				title: 'Error setting clipboard text',
				description: result?.error instanceof Error ? result.error.message : undefined,
				error: result?.error,
			});
		}
		return result.data;
	});

export default handler;

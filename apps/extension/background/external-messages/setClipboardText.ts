import { Effect } from 'effect';
import { BackgroundServiceWorkerError } from '~lib/commands';
import setClipboardText from '../scripts/setClipboardText';

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
		return yield* Effect.async<string, BackgroundServiceWorkerError>((resume) =>
			chrome.scripting.executeScript(
				{
					target: { tabId: currentTabId },
					world: 'MAIN',
					func: setClipboardText,
					args: [text],
				},
				([{ result }]) => {
					if (!result || !result.isSuccess) {
						resume(
							Effect.fail(
								new BackgroundServiceWorkerError({
									title: 'No result from setClipboardText',
									description: result?.error instanceof Error ? result.error.message : undefined,
									error: result?.error,
								}),
							),
						);
						return;
					}
					resume(Effect.succeed(result.data));
				},
			),
		);
	});

export default handler;

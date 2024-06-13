import { Console, Effect } from 'effect';
import { getActiveTabId } from '~background/messages/getActiveTabId';
import { WhisperingError } from '~lib/errors';

const handler = (sound: 'start' | 'stop' | 'cancel') =>
	Effect.gen(function* () {
		yield* Console.info('Playing sound', sound);
		const activeTabId = yield* getActiveTabId.pipe(
			Effect.mapError(
				(error) =>
					new WhisperingError({
						title: 'Failed to get active tab ID',
						description: 'Failed to get active tab ID to play sound',
						error,
					}),
			),
		);
		yield* Effect.tryPromise({
			try: () =>
				chrome.tabs.sendMessage(activeTabId, {
					message: 'playSound',
					sound,
				}),
			catch: (error) =>
				new WhisperingError({
					title: `Failed to play sound ${sound}`,
					description: `Failed to play sound ${sound} in active tab ${activeTabId}`,
					error,
				}),
		});

		return true;
	});

export default handler;

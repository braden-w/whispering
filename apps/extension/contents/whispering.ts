import { Schema as S } from '@effect/schema';
import { sendToBackground } from '@plasmohq/messaging';
import { WhisperingError, settingsSchema } from '@repo/shared';
import { Effect } from 'effect';
import type { PlasmoCSConfig } from 'plasmo';
import * as GetActiveTabId from '~background/messages/getActiveTabId';

export const config: PlasmoCSConfig = {
	matches: ['http://localhost:5173/*'],
};

const onLoadSendWhisperingLoadedMessageProgram = Effect.gen(function* () {
	const activeTabIdResult = yield* Effect.tryPromise({
		try: () =>
			sendToBackground<GetActiveTabId.RequestBody, GetActiveTabId.ResponseBody>({
				name: 'getActiveTabId',
			}),
		catch: (error) =>
			new WhisperingError({
				title: 'Unable to get active tab ID',
				description:
					'An error occurred while trying to get the active tab ID. The whisperingTabContentReady message will not be sent to the active tab.',
				error,
			}),
	});
	if (!activeTabIdResult.isSuccess) {
		return;
	}
	const activeTabId = activeTabIdResult.data;
	yield* Effect.tryPromise({
		try: () =>
			sendToBackground({
				name: 'whisperingTabContentReady',
				body: { tabId: activeTabId },
			}),
		catch: (error) =>
			new WhisperingError({
				title: `Unable to send whisperingTabContentReady message to active tab`,
				description:
					error instanceof Error
						? error.message
						: 'There was likely an issue sending the whisperingTabContentReady message to the active tab.',
				error,
			}),
	});
});
onLoadSendWhisperingLoadedMessageProgram.pipe(Effect.runPromise);

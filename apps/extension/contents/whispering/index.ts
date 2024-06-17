import { Schema as S } from '@effect/schema';
import { sendToBackground } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { WhisperingError, effectToResult, settingsSchema } from '@repo/shared';
import { Console, Effect } from 'effect';
import type { PlasmoCSConfig } from 'plasmo';
import * as GetActiveTabId from '~background/messages/getActiveTabId';
import { getSettings } from './getSettings';
import { setSettings } from './setSettings';
import { renderErrorAsToast } from '~lib/errors';

export const config: PlasmoCSConfig = {
	matches: ['http://localhost:5173/*'],
};

const whisperingMessageSchema = S.Union(
	S.Struct({ commandName: S.Literal('getSettings') }),
	S.Struct({ commandName: S.Literal('setSettings'), settings: settingsSchema }),
);

export type WhisperingMessage = S.Schema.Type<typeof whisperingMessageSchema>;

chrome.runtime.onMessage.addListener(
	(requestUnparsed, sender, sendResponse: <R extends Result<any>>(response: R) => void) =>
		Effect.gen(function* () {
			const whisperingMessage = S.decodeUnknownSync(whisperingMessageSchema)(requestUnparsed);
			yield* Console.info('Received message in Whispering content script', whisperingMessage);
			switch (whisperingMessage.commandName) {
				case 'getSettings':
					return yield* getSettings();
				case 'setSettings':
					const { settings } = whisperingMessage;
					return yield* setSettings(settings);
			}
		}).pipe(
			Effect.catchAll(renderErrorAsToast('content')),
			effectToResult,
			Effect.map(sendResponse),
			Effect.runPromise,
		),
);

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

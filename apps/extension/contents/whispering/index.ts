import { sendToBackground } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { Console, Effect } from 'effect';
import type { PlasmoCSConfig } from 'plasmo';
import { toast } from 'sonner';
import { z } from 'zod';
import * as GetActiveTabId from '~background/messages/getActiveTabId';
import { WhisperingError } from '@repo/shared';
import { settingsSchema } from '~lib/services/local-storage';
import getSettings from './getSettings';
import setSettings from './setSettings';

export const config: PlasmoCSConfig = {
	matches: ['http://localhost:5173/*'],
};

const whisperingMessageSchema = z.discriminatedUnion('commandName', [
	z.object({ commandName: z.literal('getSettings') }),
	z.object({ commandName: z.literal('setSettings'), settings: settingsSchema }),
]);

export type WhisperingMessage = z.infer<typeof whisperingMessageSchema>;

chrome.runtime.onMessage.addListener(
	(requestUnparsed, sender, sendResponse: <R extends Result<any>>(response: R) => void) =>
		Effect.gen(function* () {
			const whisperingMessage = whisperingMessageSchema.parse(requestUnparsed);
			yield* Console.info('Received message in Whispering content script', whisperingMessage);
			switch (whisperingMessage.commandName) {
				case 'getSettings':
					return yield* getSettings();
				case 'setSettings':
					const { settings } = whisperingMessage;
					return yield* setSettings(settings);
			}
		}).pipe(
			Effect.map((result) => ({ isSuccess: true, data: result }) as const),
			Effect.catchAll((error) => {
				toast.error(error.title, {
					description: error.description,
				});
				return Effect.succeed({ isSuccess: false, error } as const);
			}),
			Effect.map((response) => sendResponse(response)),
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

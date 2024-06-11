import type { Result } from '@repo/shared';
import { Console, Effect } from 'effect';
import type { PlasmoCSConfig } from 'plasmo';
import { toast } from 'sonner';
import { z } from 'zod';
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

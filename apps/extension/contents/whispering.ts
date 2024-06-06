// import { type MessageToContentScriptRequest } from '$lib/utils/messaging';
import { Console, Effect } from 'effect';
import type { PlasmoCSConfig } from 'plasmo';
import { commands, type MessageToContext } from '~lib/commands';

// import { CHATGPT_DOMAINS } from './chatGptButton';

export const config: PlasmoCSConfig = {
	matches: ['http://localhost:5173/*'],
	// exclude_matches: CHATGPT_DOMAINS,
};

const _registerListeners = chrome.runtime.onMessage.addListener(
	(message: MessageToContext<'WhisperingContentScript'>, sender, sendResponse) => {
		const program = Effect.gen(function* () {
			const { commandName, args } = message;
			yield* Console.info('Received message in Whispering content script', { commandName, args });
			const correspondingCommand = commands[commandName];
			const response = yield* correspondingCommand.runInWhisperingContentScript(...args);
			yield* Console.info(
				`Responding to invoked command ${commandName} in Whispering content script`,
				{
					response,
				},
			);
			sendResponse(response);
		});
		program.pipe(Effect.runPromise);
		return true; // Will respond asynchronously.
	},
);

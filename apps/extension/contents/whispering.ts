// import { type MessageToContentScriptRequest } from '$lib/utils/messaging';
import { Effect } from 'effect';
import type { PlasmoCSConfig } from 'plasmo';
import { commands, type MessageToContext } from '~lib/utils/commands';
// import { CHATGPT_DOMAINS } from './chatGptButton';

export const config: PlasmoCSConfig = {
	// matches: ['http://localhost:5173/*'],
	// matches: ['http://localhost:5173/*'],
	// exclude_matches: CHATGPT_DOMAINS,
};

chrome.runtime.onMessage.addListener(
	(message: MessageToContext<'WhisperingContentScript'>, sender, sendResponse) =>
		Effect.gen(function* () {
			const { commandName, args } = message;
			const correspondingCommand = commands[commandName];
			sendResponse(yield* correspondingCommand.runInWhisperingContentScript(...args));
			return true; // Will respond asynchronously.
		}).pipe(Effect.runPromise),
);

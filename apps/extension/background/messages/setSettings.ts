import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result, Settings } from '@repo/shared';
import { WhisperingError, effectToResult } from '@repo/shared';
import { Effect } from 'effect';
import { contentCommands, getOrCreateWhisperingTabId } from '~background/contentScriptCommands';
import { renderErrorAsToast } from '~lib/errors';

export type RequestBody = { settings: Settings };

export type ResponseBody = Result<void>;

export const setSettings = (settings: Settings): Effect.Effect<void, WhisperingError> =>
	Effect.gen(function* () {
		const whisperingTabId = yield* getOrCreateWhisperingTabId;
		const [injectionResult] = yield* Effect.tryPromise({
			try: () =>
				chrome.scripting.executeScript<[string], Result<string>>({
					target: { tabId: whisperingTabId },
					world: 'MAIN',
					func: (text: string) => {
						try {
							navigator.clipboard.writeText(text);
							return { isSuccess: true, data: text } as const;
						} catch (error) {
							return {
								isSuccess: false,
								error: {
									title: 'Unable to copy transcribed text to clipboard in active tab',
									description: error instanceof Error ? error.message : `Unknown error: ${error}`,
									error,
								},
							} as const;
						}
					},
					args: [text],
				}),
			catch: (error) =>
				new WhisperingError({
					title: 'Unable to execute setClipboardText script in active tab',
					description: error instanceof Error ? error.message : `Unknown error: ${error}`,
					error,
				}),
		});
		yield* Console.info('Injection result "setClipboardText" script:', injectionResult);
		if (!injectionResult || !injectionResult.result) {
			return yield* new WhisperingError({
				title: 'Unable to copy transcribed text to clipboard in active tab',
				description: 'The result of the script injection is undefined',
			});
		}
		const { result } = injectionResult;
		yield* Console.info('setClipboardText result:', result);
		if (!result.isSuccess) {
			return yield* new WhisperingError({
				title: 'Unable to copy transcribed text to clipboard in active tab',
				description:
					result.error instanceof Error ? result.error.message : `Unknown error: ${result.error}`,
				error: result.error,
			});
		}
	});

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = ({ body }, res) =>
	Effect.gen(function* () {
		if (!body || !body.settings) {
			return yield* new WhisperingError({
				title: 'Error setting Whispering settings',
				description: 'Settings must be provided in the message request body',
			});
		}
		yield* contentCommands.setSettings(body.settings);
	}).pipe(
		Effect.tapError(renderErrorAsToast('bgsw')),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;

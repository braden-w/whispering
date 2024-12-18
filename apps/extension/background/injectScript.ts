import { type Result, WhisperingError, resultToEffect } from '@repo/shared';
import { Console, Effect } from 'effect';

export const injectScript = <T, Args extends any[]>({
	tabId,
	commandName,
	func,
	args,
}: {
	tabId: number;
	commandName: string;
	func: (...args: Args) => Result<T>;
	args: Args;
}) =>
	Effect.gen(function* () {
		const [injectionResult] = yield* Effect.tryPromise({
			try: () =>
				chrome.scripting.executeScript<Args, Result<T>>({
					target: { tabId },
					world: 'MAIN',
					func,
					args,
				}),
			catch: (error) => ({
				_tag: 'WhisperingError',
				title: `Unable to execute "${commandName}" script in Whispering tab`,
				description:
					'This might be due to the tab not being awake or not in the correct domain.',
				action: { type: 'more-details', error },
			}),
		});
		yield* Console.info(
			`Injection result "${commandName}" script:`,
			injectionResult,
		);
		if (!injectionResult || !injectionResult.result) {
			return yield* {
				_tag: 'WhisperingError',
				title: `Unable to execute "${commandName}" script in Whispering tab`,
				description: 'The result of the script injection is undefined',
				action: { type: 'none' },
			};
		}
		const { result } = injectionResult;
		return yield* resultToEffect(result);
	});

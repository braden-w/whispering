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
			catch: (error) =>
				new WhisperingError({
					title: `Unable to execute "${commandName}" script in Whispering tab`,
					description:
						error instanceof Error ? error.message : `Unknown error: ${error}`,
					error,
				}),
		});
		yield* Console.info(
			`Injection result "${commandName}" script:`,
			injectionResult,
		);
		if (!injectionResult || !injectionResult.result) {
			return yield* new WhisperingError({
				title: `Unable to "${commandName}" in Whispering tab`,
				description: 'The result of the script injection is undefined',
			});
		}
		const { result } = injectionResult;
		return yield* resultToEffect(result);
	});

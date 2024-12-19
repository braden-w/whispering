import {
	BubbleErr,
	type WhisperingResult,
	tryAsyncWhispering,
} from '@repo/shared';

export const injectScript = async <T, Args extends unknown[]>({
	tabId,
	commandName,
	func,
	args,
}: {
	tabId: number;
	commandName: string;
	func: (...args: Args) => WhisperingResult<T>;
	args: Args;
}): Promise<WhisperingResult<T>> => {
	const injectionResult = await tryAsyncWhispering({
		try: () =>
			chrome.scripting.executeScript<Args, WhisperingResult<T>>({
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
	if (!injectionResult.ok) return injectionResult;
	const [executeScriptResult] = injectionResult.data;
	console.info(
		`Injection result "${commandName}" script:`,
		executeScriptResult,
	);
	if (!executeScriptResult || !executeScriptResult.result) {
		return WhisperingErr({
			title: `Unable to execute "${commandName}" script in Whispering tab`,
			description: 'The result of the script injection is undefined',
			action: { type: 'none' },
		});
	}
	const { result } = executeScriptResult;
	return result;
};

import { tryAsync } from '@epicenterhq/result';
import { WhisperingErr, type WhisperingResult } from '@repo/shared';

export async function injectScript<T, Args extends unknown[]>({
	tabId,
	commandName,
	func,
	args,
}: {
	tabId: number;
	commandName: string;
	func: (...args: Args) => WhisperingResult<T>;
	args: Args;
}): Promise<WhisperingResult<T>> {
	const injectionResult = await tryAsync({
		try: () =>
			chrome.scripting.executeScript<Args, WhisperingResult<T>>({
				target: { tabId },
				world: 'MAIN',
				func,
				args,
			}),
		mapErr: (error) =>
			WhisperingErr({
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
		});
	}
	const { result } = executeScriptResult;
	return result;
}

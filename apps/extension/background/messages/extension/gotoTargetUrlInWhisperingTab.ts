import { Ok } from '@epicenterhq/result';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { WhisperingResult } from '@repo/shared';
import { WhisperingErr } from '@repo/shared';
import { injectScript } from '~background/injectScript';
import { getOrCreateWhisperingTabId } from '~background/getOrCreateWhisperingTabId';

export async function gotoTargetUrlInWhisperingTab(
	path: string,
): Promise<WhisperingResult<void>> {
	const getWhisperingTabIdResult = await getOrCreateWhisperingTabId();
	if (!getWhisperingTabIdResult.ok) return getWhisperingTabIdResult;
	const whisperingTabId = getWhisperingTabIdResult.data;
	if (!whisperingTabId)
		return WhisperingErr({
			title: 'Whispering tab not found',
			description: 'The Whispering tab was not found.',
		});
	const injectScriptResult = await injectScript<undefined, [string]>({
		tabId: whisperingTabId,
		commandName: 'goto',
		func: (route) => {
			try {
				window.goto(route);
				return { ok: true, data: undefined } as const;
			} catch (error) {
				return {
					ok: false,
					error: {
						_tag: 'WhisperingError',
						variant: 'error',
						title: `Unable to go to route ${route} in Whispering tab`,
						description:
							'There was an error going to the route in the Whispering tab.',
						action: {
							type: 'more-details',
							error,
						},
					},
				} as const;
			}
		},
		args: [path],
	});
	if (!injectScriptResult.ok) return injectScriptResult;
	await chrome.tabs.update(whisperingTabId, { active: true });
	return Ok(undefined);
}

export type GotoTargetUrlInWhisperingTabMessage = {
	path: string;
};
export type GotoTargetUrlInWhisperingTabResult = WhisperingResult<void>;

const handler: PlasmoMessaging.MessageHandler<
	GotoTargetUrlInWhisperingTabMessage,
	GotoTargetUrlInWhisperingTabResult
> = async ({ body }, res) => {
	if (!body?.path) {
		res.send(
			WhisperingErr({
				title: 'Path required',
				description: 'A valid path is required for navigation.',
			}),
		);
		return;
	}
	res.send(await gotoTargetUrlInWhisperingTab(body.path));
};

export default handler;

import { Err, tryAsync, type BubbleError, type Result } from '@repo/shared';
import { Data, Effect, Option } from 'effect';

export const getActiveTabId = (): Promise<
	Result<number | undefined, BubbleError<'GetActiveTabIdError'>>
> =>
	tryAsync({
		try: async () => {
			const [activeTab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});
			return activeTab?.id;
		},
		catch: (error) => ({
			_tag: 'GetActiveTabIdError',
			message: 'Error getting active tab ID',
		}),
	});

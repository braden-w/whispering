import { type BubbleError, type Result, tryAsync } from '@repo/shared';

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
			message: 'Unable to get active tab ID',
		}),
	});

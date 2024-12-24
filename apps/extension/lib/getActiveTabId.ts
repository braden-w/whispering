import { tryAsyncBubble } from '@repo/shared';

export const getActiveTabId = () =>
	tryAsyncBubble({
		try: async () => {
			const [activeTab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});
			return activeTab?.id;
		},
		mapErr: (error) => ({
			_tag: 'GetActiveTabIdError',
			message: 'Unable to get active tab ID',
		}),
	});

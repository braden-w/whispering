import {
	type ExternalMessageBody,
	Ok,
	type WhisperingResult,
	WHISPERING_URL,
	WHISPERING_URL_WILDCARD,
	externalMessageSchema,
	tryAsyncWhispering,
} from '@repo/shared';
import { injectScript } from '~background/injectScript';

export const getOrCreateWhisperingTabId = async (): Promise<
	WhisperingResult<number>
> => {
	const getAllWhisperingTabsResult = await getAllWhisperingTabs();
	if (!getAllWhisperingTabsResult.ok) return getAllWhisperingTabsResult;
	const whisperingTabs = getAllWhisperingTabsResult.data;

	if (whisperingTabs.length === 0) {
		return await createAndSetupNewTab();
	}

	const getBestWhisperingTabResult = await getBestWhisperingTab(whisperingTabs);
	if (!getBestWhisperingTabResult.ok) return getBestWhisperingTabResult;
	const bestWhisperingTabId = getBestWhisperingTabResult.data;

	const otherWhisperingTabIds = whisperingTabs
		.map((tab) => tab.id)
		.filter((tabId) => tabId !== undefined)
		.filter((tabId) => tabId !== bestWhisperingTabId);

	const results = await removeTabsById(otherWhisperingTabIds);
	return Ok(bestWhisperingTabId);
};

async function getBestWhisperingTab(
	tabs: chrome.tabs.Tab[],
): Promise<WhisperingResult<number>> {
	const undiscardedWhisperingTabs = tabs.filter((tab) => !tab.discarded);
	const pinnedUndiscardedWhisperingTabs = undiscardedWhisperingTabs.filter(
		(tab) => tab.pinned,
	);
	for (const pinnedUndiscardedTab of pinnedUndiscardedWhisperingTabs) {
		if (!pinnedUndiscardedTab.id) continue;
		const isResponsive = await checkTabResponsiveness(pinnedUndiscardedTab.id);
		if (isResponsive) return Ok(pinnedUndiscardedTab.id);
	}
	for (const undiscardedTab of undiscardedWhisperingTabs) {
		if (!undiscardedTab.id) continue;
		const isResponsive = await checkTabResponsiveness(undiscardedTab.id);
		if (isResponsive) return Ok(undiscardedTab.id);
	}
	return await createAndSetupNewTab();
}

async function checkTabResponsiveness(tabId: number) {
	const injectScriptResult = await injectScript<'pong', []>({
		tabId,
		commandName: 'ping',
		func: () => ({ ok: true, data: 'pong' }),
		args: [],
	});
	if (!injectScriptResult.ok) return false;
	return true;
}

async function createAndSetupNewTab(): Promise<WhisperingResult<number>> {
	const createWhisperingTabResult = await createWhisperingTab();
	if (!createWhisperingTabResult.ok) return createWhisperingTabResult;
	const newTabId = createWhisperingTabResult.data;
	const makeTabUndiscardableByIdResult =
		await makeTabUndiscardableById(newTabId);
	if (!makeTabUndiscardableByIdResult.ok) return makeTabUndiscardableByIdResult;
	const pinTabByIdResult = await pinTabById(newTabId);
	if (!pinTabByIdResult.ok) return pinTabByIdResult;
	return Ok(newTabId);
}

const getAllWhisperingTabs = () =>
	tryAsyncWhispering({
		try: () => chrome.tabs.query({ url: WHISPERING_URL_WILDCARD }),
		mapErr: (error) => ({
			_tag: 'WhisperingError',
			title: 'Error getting Whispering tabs',
			description: 'Error querying for Whispering tabs in the browser.',
			action: {
				type: 'more-details',
				error,
			},
		}),
	});

/**
 * Creates a new Whispering tab, then waits for a Whispering content script to
 * send a message indicating that it's ready to toggle recording, cancel
 * recording, etc.
 */
function createWhisperingTab() {
	return tryAsyncWhispering({
		try: () =>
			new Promise<number>((resolve, reject) => {
				chrome.runtime.onMessage.addListener(
					function contentReadyListener(message, sender, sendResponse) {
						if (!isNotifyWhisperingTabReadyMessage(message)) return;
						if (!sender.tab?.id) return;
						resolve(sender.tab.id);
						chrome.runtime.onMessage.removeListener(contentReadyListener);
					},
				);
				// Perform your desired action here
				chrome.tabs.create({
					url: WHISPERING_URL,
					active: false,
					pinned: true,
				});
			}),
		mapErr: (error) => ({
			_tag: 'WhisperingError',
			title: 'Error creating Whispering tab',
			description: 'Error creating Whispering tab in the browser.',
			action: { type: 'more-details', error },
		}),
	});
}

function isNotifyWhisperingTabReadyMessage(
	message: unknown,
): message is ExternalMessageBody<'whispering-extension/notifyWhisperingTabReady'> {
	const externalMessageResult = externalMessageSchema.safeParse(message);
	if (!externalMessageResult.success) return false;
	const externalMessage = externalMessageResult.data;
	return (
		externalMessage.name === 'whispering-extension/notifyWhisperingTabReady'
	);
}

function makeTabUndiscardableById(tabId: number) {
	return tryAsyncWhispering({
		try: () => chrome.tabs.update(tabId, { autoDiscardable: false }),
		mapErr: (error) => ({
			_tag: 'WhisperingError',
			title: 'Unable to make Whispering tab undiscardable',
			description: 'Error updating Whispering tab to make it undiscardable.',
			action: { type: 'more-details', error },
		}),
	});
}

function pinTabById(tabId: number) {
	return tryAsyncWhispering({
		try: () => chrome.tabs.update(tabId, { pinned: true }),
		mapErr: (error) => ({
			_tag: 'WhisperingError',
			title: 'Unable to pin Whispering tab',
			description: 'Error pinning Whispering tab.',
			action: { type: 'more-details', error },
		}),
	});
}

function removeTabsById(tabIds: number[]) {
	return Promise.all(
		tabIds.map((tabId) =>
			tryAsyncWhispering({
				try: () => chrome.tabs.remove(tabId),
				mapErr: (error) => ({
					_tag: 'WhisperingError',
					title: `Error closing Whispering tab ${tabId}`,
					description: `Error closing Whispering tab ${tabId} in the browser.`,
					action: { type: 'more-details', error },
				}),
			}),
		),
	);
}

import { sendToBackground } from '@plasmohq/messaging';
import { useStorage } from '@plasmohq/storage/hook';
import { WhisperingError, recorderStateToIcons, type RecorderState } from '@repo/shared';
import cssText from 'data-text:~/style.css';
import { Effect } from 'effect';
import type { PlasmoCSConfig, PlasmoGetInlineAnchor, PlasmoGetStyle } from 'plasmo';
import { renderErrorAsNotification } from '~lib/errors';
import { NotificationServiceContentLive } from '~lib/services/NotificationServiceContentLive';
import { STORAGE_KEYS } from '~lib/services/extension-storage';
import type * as ToggleRecording from '../background/messages/contents/toggleRecording';

const waitForElement = (selector: string): Promise<Element> =>
	new Promise((resolve, reject) => {
		const element = document.querySelector(selector);
		if (element) return resolve(element);

		const observer = new MutationObserver((mutations) => {
			mutations.forEach(() => {
				const element = document.querySelector(selector);
				if (element) {
					resolve(element);
					observer.disconnect();
				}
			});
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});

		// Optional timeout to prevent indefinite waiting
		setTimeout(() => {
			observer.disconnect();
			reject(new Error(`Element with selector "${selector}" not found within timeout`));
		}, 10000); // Adjust timeout as needed
	});

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
	const selector = 'div[aria-label="Write your prompt to Claude"]';
	const element = await waitForElement(selector);
	return {
		element,
		insertPosition: 'afterend',
	};
};

export const config: PlasmoCSConfig = {
	matches: ['https://claude.ai/*'],
	all_frames: true,
};

export const getStyle: PlasmoGetStyle = () => {
	const style = document.createElement('style');
	style.textContent = cssText.replaceAll(':root', ':host(plasmo-csui)');
	return style;
};

const toggleRecordingFromContentScript = () =>
	Effect.tryPromise({
		try: () =>
			sendToBackground<ToggleRecording.RequestBody, ToggleRecording.ResponseBody>({
				name: 'contents/toggleRecording',
			}),
		catch: (error) =>
			new WhisperingError({
				title: `Unable to toggle recording via background service worker`,
				description:
					error instanceof Error
						? error.message
						: 'There was likely an issue sending the message to the background service worker from the contentscript.',
				error,
			}),
	}).pipe(
		Effect.catchAll(renderErrorAsNotification),
		Effect.provide(NotificationServiceContentLive),
		Effect.runPromise,
	);

function RecorderStateAsIcon() {
	const [recorderState] = useStorage<RecorderState>(STORAGE_KEYS.RECORDER_STATE, 'IDLE');
	const recorderStateAsIcon = recorderStateToIcons[recorderState];
	return (
		<button
			className="group relative z-10 h-8 w-8 rounded-md text-xl"
			onClick={toggleRecordingFromContentScript}
		>
			<div className="absolute inset-0 rounded-md bg-black bg-opacity-0 transition-opacity duration-300 group-hover:bg-opacity-10"></div>
			{recorderStateAsIcon}
		</button>
	);
}

export default RecorderStateAsIcon;

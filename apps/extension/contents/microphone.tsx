import { sendToBackground } from '@plasmohq/messaging';
import { useStorage } from '@plasmohq/storage/hook';
import { recorderStateToIcons, type RecorderState } from '@repo/shared';
import cssText from 'data-text:~/style.css';
import { Effect } from 'effect';
import type { PlasmoCSConfig, PlasmoGetStyle, PlasmoWatchOverlayAnchor } from 'plasmo';
import { WhisperingError, renderErrorAsToast } from '~lib/errors';
import type * as ToggleRecording from '../background/messages/toggleRecording';

export const getOverlayAnchorList = async () => {
	const inputs = document.querySelectorAll(
		"input[type='text'], input[type='search'], input[type='email'], input[type='url'], input[type='tel'], input[type='password'], input[type='number'], input:not([type]), textarea, [contenteditable='true'], [contenteditable='']",
	);
	return Array.from(inputs).map((element) => ({
		element,
		insertPosition: 'afterend',
	}));
};

export const config: PlasmoCSConfig = {
	matches: ['<all_urls>'],
	all_frames: true,
};

export const getStyle: PlasmoGetStyle = () => {
	const style = document.createElement('style');
	style.textContent = cssText;
	return style;
};

export const watchOverlayAnchor: PlasmoWatchOverlayAnchor = (updatePosition) => {
	const interval = setInterval(() => {
		updatePosition();
	}, 420);

	// Clear the interval when unmounted
	return () => {
		clearInterval(interval);
	};
};

const toggleRecording = () =>
	Effect.tryPromise({
		try: () =>
			sendToBackground<ToggleRecording.RequestBody, ToggleRecording.ResponseBody>({
				name: 'toggleRecording',
			}),
		catch: (error) =>
			new WhisperingError({
				title: `Unable to toggle recording via background service worker`,
				description:
					error instanceof Error
						? error.message
						: 'There was likely an issue sending the message to the background service worker from the popup.',
				error,
			}),
	}).pipe(Effect.catchAll(renderErrorAsToast), Effect.runPromise);

function RecorderStateAsIcon() {
	const [recorderState] = useStorage<RecorderState>('whispering-recording-state');
	const recorderStateAsIcon = recorderStateToIcons[recorderState ?? 'IDLE'];
	return (
		<button className="inset-y right-8" onClick={toggleRecording}>
			{recorderStateAsIcon}
		</button>
	);
}

export default RecorderStateAsIcon;

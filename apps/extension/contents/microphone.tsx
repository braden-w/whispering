import { sendToBackground } from '@plasmohq/messaging';
import { useStorage } from '@plasmohq/storage/hook';
import { recorderStateToIcons, type RecorderState } from '@repo/shared';
import cssText from 'data-text:~/style.css';
import { Effect } from 'effect';
import type { PlasmoCSConfig, PlasmoGetInlineAnchor, PlasmoGetStyle } from 'plasmo';
import { WhisperingError, renderErrorAsToast } from '~lib/errors';
import type * as ToggleRecording from '../background/messages/toggleRecording';

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
	const element = document.querySelector('#prompt-textarea')?.closest('div');
	return {
		element,
		insertPosition: 'afterend',
	};
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
	return <button onClick={toggleRecording}>{recorderStateAsIcon}</button>;
}

export default RecorderStateAsIcon;

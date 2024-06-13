import cssText from 'data-text:~/style.css';
import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo';
import { useStorage } from '@plasmohq/storage/hook';
import { type RecorderState, recorderStateToIcons } from '@repo/shared';

export const getInlineAnchorList = async () => {
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

function RecorderStateAsIcon() {
	const [recorderState] = useStorage<RecorderState>('whispering-recording-state');
	const recorderStateAsIcon = recorderStateToIcons[recorderState ?? 'IDLE'];
	return recorderStateAsIcon;
}

export default RecorderStateAsIcon;

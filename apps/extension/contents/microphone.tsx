import { useStorage } from '@plasmohq/storage/hook';
import { recorderStateToIcons, type RecorderState } from '@repo/shared';
import cssText from 'data-text:~/style.css';
import type {
	PlasmoCSConfig,
	PlasmoGetInlineAnchorList,
	PlasmoGetStyle,
	PlasmoMountShadowHost,
} from 'plasmo';
import { cn } from '~lib/utils';
import { toggleRecordingFromContentScript } from './utils';

export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
	const editableElements = document.querySelectorAll(
		"input[type='text'], input[type='search'], input[type='email'], input[type='url'], input[type='tel'], input[type='password'], input[type='number'], input:not([type]), textarea, [contenteditable='true'], [contenteditable='']",
	);
	return Array.from(editableElements).map((element) => ({
		element,
		insertPosition: 'afterend',
	}));
};

export const mountShadowHost: PlasmoMountShadowHost = ({ shadowHost, anchor, mountState }) => {
	if (!anchor?.element) return;
	const editableElement = anchor.element as HTMLElement;

	const wrapper = document.createElement('div');
	wrapper.style.display = 'flex';
	wrapper.style.alignItems = 'center';

	editableElement.style.width = '100%';

	editableElement.parentNode?.insertBefore(wrapper, editableElement);
	wrapper.appendChild(editableElement);
	wrapper.appendChild(shadowHost);

	// mountState?.observer?.disconnect(); // OPTIONAL DEMO: stop the observer as needed
};

export const config: PlasmoCSConfig = {
	matches: ['<all_urls>'],
	all_frames: true,
};

export const getStyle: PlasmoGetStyle = () => {
	const style = document.createElement('style');
	style.textContent = cssText.replaceAll(':root', ':host(plasmo-csui)');
	return style;
};

function RecorderStateAsIcon() {
	const [recorderState] = useStorage<RecorderState>('whispering-recording-state', 'IDLE');
	const recorderStateAsIcon = recorderStateToIcons[recorderState];
	return (
		<button
			className={cn('h-10 w-10', 'transform hover:scale-110 focus:scale-110')}
			style={{ filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5))' }}
			onClick={toggleRecordingFromContentScript}
		>
			{recorderStateAsIcon}
		</button>
	);
}

export default RecorderStateAsIcon;

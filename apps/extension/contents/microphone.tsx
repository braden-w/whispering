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
	const inputs = document.querySelectorAll(
		"input[type='text'], input[type='search'], input[type='email'], input[type='url'], input[type='tel'], input[type='password'], input[type='number'], input:not([type]), textarea, [contenteditable='true'], [contenteditable='']",
	);
	return Array.from(inputs).map((element) => ({
		element,
		insertPosition: 'afterend',
	}));
};

export const mountShadowHost: PlasmoMountShadowHost = ({ shadowHost, anchor, mountState }) => {
	const wrapper = document.createElement('div');
	wrapper.style.display = 'flex';
	wrapper.style.alignItems = 'center';

	anchor.element.style.width = '100%';

	anchor?.element?.parentNode?.insertBefore(wrapper, anchor.element);
	wrapper.appendChild(anchor?.element);
	wrapper.appendChild(shadowHost);
	mountState.observer.disconnect(); // OPTIONAL DEMO: stop the observer as needed
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
			className={cn(
				// buttonVariants({ size: 'icon' }),
				// 'mb-1 mr-1 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:outline-black disabled:bg-[#D7D7D7] disabled:text-[#f4f4f4] disabled:hover:opacity-100 dark:bg-white dark:text-black dark:focus-visible:outline-white',
				'h-9 w-9',
				'rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-gray-900 md:bottom-3 md:p-2',
			)}
			onClick={toggleRecordingFromContentScript}
		>
			{recorderStateAsIcon}
		</button>
	);
}

export default RecorderStateAsIcon;

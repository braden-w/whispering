import cssText from 'data-text:~/style.css';
import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo';
import { useStorage } from '@plasmohq/storage/hook';
import { type RecorderState, recorderStateToIcons } from '@repo/shared';

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

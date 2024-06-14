import { useStorage } from '@plasmohq/storage/hook';
import type { RecorderState } from '@repo/shared';
import cssText from 'data-text:~/style.css';
import { EllipsisIcon, MicIcon, SquareIcon } from 'lucide-react';
import type { PlasmoCSConfig, PlasmoGetInlineAnchor, PlasmoGetStyle } from 'plasmo';
import { cn } from '~lib/utils';
import { buttonVariants, toggleRecordingFromContentScript } from './utils';

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
	style.textContent = cssText.replaceAll(':root', ':host(plasmo-csui)');
	return style;
};

const recorderStateToIcons = {
	RECORDING: <SquareIcon />,
	LOADING: <EllipsisIcon />,
	IDLE: <MicIcon />,
} as const satisfies Record<RecorderState, React.JSX.Element>;

function RecorderStateAsIcon() {
	const [recorderState] = useStorage<RecorderState>('whispering-recording-state');
	const recorderStateAsIcon = recorderStateToIcons[recorderState ?? 'IDLE'];
	return (
		<button
			className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'rounded-full')}
			onClick={toggleRecordingFromContentScript}
		>
			{recorderStateAsIcon}
		</button>
	);
}

export default RecorderStateAsIcon;

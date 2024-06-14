import type { PlasmoGetOverlayAnchorList } from 'plasmo';
import { sendToBackground } from '@plasmohq/messaging';
import { useStorage } from '@plasmohq/storage/hook';
import { recorderStateToIcons, type RecorderState } from '@repo/shared';
import cssText from 'data-text:~/style.css';
import { Effect } from 'effect';
import type { PlasmoCSConfig, PlasmoGetStyle, PlasmoWatchOverlayAnchor } from 'plasmo';
import { WhisperingError, renderErrorAsToast } from '~lib/errors';
import type * as ToggleRecording from '../background/messages/toggleRecording';

export const getOverlayAnchorList: PlasmoGetOverlayAnchorList = async () => {
	const inputs = document.querySelectorAll(
		"input[type='text'], input[type='search'], input[type='email'], input[type='url'], input[type='tel'], input[type='password'], input[type='number'], input:not([type]), textarea, [contenteditable='true'], [contenteditable='']",
	);
	return inputs;
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

function DraggableIcon() {
	const [position, setPosition] = useState({ x: 0, y: 0 });
	useEffect(() => {
		// Load saved position from localStorage
		const savedPosition = localStorage.getItem('buttonPosition');
		if (savedPosition) {
			setPosition(JSON.parse(savedPosition));
		}
	}, []);
	return (
		<Draggable
			position={position}
			onStop={(e, data) => {
				const newPosition = { x: data.x, y: data.y };
				setPosition(newPosition);
				// Save position to localStorage
				localStorage.setItem('buttonPosition', JSON.stringify(newPosition));
			}}
		>
			<RecorderStateAsIcon />
		</Draggable>
	);
}
function RecorderStateAsIcon() {
	const [recorderState] = useStorage<RecorderState>('whispering-recording-state');
	const recorderStateAsIcon = recorderStateToIcons[recorderState ?? 'IDLE'];
	return (
		<button className="inset-y absolute right-8" onClick={toggleRecording}>
			{recorderStateAsIcon}
		</button>
	);
}

export default RecorderStateAsIcon;

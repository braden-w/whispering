import cssText from 'data-text:~/style.css';
import { Console, Effect } from 'effect';
import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo';
import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { extensionStorage } from '~lib/services/extension-storage';
import { recorderService } from '~lib/services/recorder';

export const config: PlasmoCSConfig = {
	matches: ['<all_urls>'],
	all_frames: true,
};

export const getStyle: PlasmoGetStyle = () => {
	const style = document.createElement('style');
	style.textContent = cssText;
	return style;
};

const syncRecorderStateWithMediaRecorderStateOnLoad = Effect.gen(function* () {
	const initialRecorderState = recorderService.recorderState;
	yield* extensionStorage.set({ key: 'whispering-recording-state', value: initialRecorderState });
	yield* Console.info('Synced recorder state with media recorder state on load', {
		initialRecorderState,
	});
}).pipe(Effect.runPromise);

function ErrorToast() {
	useEffect(
		() =>
			Effect.gen(function* () {
				yield* extensionStorage.watch({
					key: 'whispering-toast',
					callback: ({ title, description, id, action }) =>
						toast.error(title, { description, id, action }),
				});
			}).pipe(Effect.runSync),
		[],
	);
	return <Toaster />;
}

export default ErrorToast;

import cssText from 'data-text:~/style.css';
import { Effect } from 'effect';
import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo';
import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { extensionStorage } from '~lib/services/extension-storage';

export const config: PlasmoCSConfig = {
	matches: ['<all_urls>'],
	all_frames: true,
};

export const getStyle: PlasmoGetStyle = () => {
	const style = document.createElement('style');
	style.textContent = cssText;
	return style;
};

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

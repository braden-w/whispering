import cssText from 'data-text:~/style.css';
import { Effect } from 'effect';
import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo';
import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { extensionStorage } from '~lib/services/extension-storage';
import { ToastService } from '../../../packages/shared/src/ToastService';
import { ToastServiceLive } from '~lib/services/ToastServiceLive';

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
				const { toast } = yield* ToastService;
				yield* extensionStorage.watch({
					key: 'whispering-toast',
					callback: (args) => toast(args),
				});
			}).pipe(Effect.provide(ToastServiceLive), Effect.runSync),
		[],
	);
	return <Toaster />;
}

export default ErrorToast;

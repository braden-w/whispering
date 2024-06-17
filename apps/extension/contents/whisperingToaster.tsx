import { TOASTER_SETTINGS } from '@repo/shared';
import cssText from 'data-text:~/style.css';
import { Effect } from 'effect';
import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo';
import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { extensionStorageService } from '~lib/services/extension-storage';

export const config: PlasmoCSConfig = {
	matches: ['<all_urls>'],
	all_frames: true,
};

export const getStyle: PlasmoGetStyle = () => {
	const style = document.createElement('style');
	style.textContent = cssText;
	return style;
};

function WhisperingToaster() {
	useEffect(
		() =>
			Effect.gen(function* () {
				yield* extensionStorageService.watch({
					key: 'whispering-toast',
					callback: ({ variant, id, title, description, descriptionClass, action }) =>
						toast[variant](title, {
							id,
							description,
							descriptionClassName: descriptionClass,
							action: action && {
								label: action.label,
								onClick: () => {
									window.location.href = action.goto;
								},
							},
						}),
				});
			}).pipe(Effect.runSync),
		[],
	);
	return <Toaster {...TOASTER_SETTINGS} />;
}

export default WhisperingToaster;

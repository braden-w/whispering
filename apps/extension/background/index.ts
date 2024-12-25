import { Err, type Ok } from '@epicenterhq/result';
import type { ToastAndNotifyOptions, WhisperingErr } from '@repo/shared';
import { toggleRecording } from '~background/messages/app/toggleRecording';
import { renderErrorAsNotification } from '~lib/errors';

chrome.runtime.onInstalled.addListener(async (details) => {
	if (details.reason === 'install') await chrome.runtime.openOptionsPage();
});

chrome.commands.onCommand.addListener(async (command) => {
	console.info('Received command via Chrome Keyboard Shortcut', command);
	if (command !== 'toggleRecording') return;
	const toggleRecordingResult = await toggleRecording();
	if (!toggleRecordingResult.ok)
		return renderErrorAsNotification(toggleRecordingResult);
});

export type BgswErrProperties = {
	_tag: 'BgswError';
} & ToastAndNotifyOptions;

export type BgswErr = Err<BgswErrProperties>;
export type BgswResult<T> = Ok<T> | BgswErr;

export const BgswErr = (
	args: Omit<BgswErrProperties, '_tag' | 'variant'>,
): BgswErr =>
	Err({
		_tag: 'BgswError',
		variant: 'error',
		...args,
	});

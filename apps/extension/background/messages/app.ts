import { sendToBackground } from '@plasmohq/messaging';
import { WhisperingErr, type Settings } from '@repo/shared';
import type { CancelRecordingResponse } from './app/cancelRecording';
import type { GetSettingsResponse } from './app/getSettings';
import type { SetSettingsResponse } from './app/setSettings';
import type { ToggleRecordingResponse } from './app/toggleRecording';

export const app = {
	getSettings: async () => {
		const response = (await sendToBackground({
			name: 'app/getSettings',
		})) as GetSettingsResponse;
		return response;
	},
	setSettings: async (settings: Settings) => {
		const response = (await sendToBackground({
			name: 'app/setSettings',
			body: settings,
		})) as SetSettingsResponse;
		return response;
	},
	toggleRecording: async () => {
		const response = (await sendToBackground({
			name: 'app/toggleRecording',
		})) as ToggleRecordingResponse;
		if (!response.ok) {
			return WhisperingErr({
				title: 'Unable to toggle recording via background service worker',
				description:
					'There was likely an issue sending the message to the background service worker from the popup.',
				action: { type: 'more-details', error: response.error },
			});
		}
		return response;
	},
	cancelRecording: async () => {
		const response = (await sendToBackground({
			name: 'app/cancelRecording',
		})) as CancelRecordingResponse;
		if (!response.ok) {
			return WhisperingErr({
				title: 'Unable to cancel recording via background service worker',
				description:
					'There was likely an issue sending the message to the background service worker from the popup.',
				action: { type: 'more-details', error: response.error },
			});
		}
		return response;
	},
};

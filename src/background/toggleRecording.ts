import {
	getIsBackgroundRecording,
	toggleIsBackgroundRecording
} from '~lib/stores/isBackgroundRecording';
import { sendMessageToContentScript } from '~lib/utils/messaging';

export async function toggleRecording() {
	let isRecording = await getIsBackgroundRecording();
	if (!isRecording) {
		const response = await sendMessageToContentScript({ name: 'startRecording' });
		await toggleIsBackgroundRecording();
	} else {
		const response = await sendMessageToContentScript({ name: 'stopRecording' });
		console.log('🚀 ~ file: background.ts:32 ~ toggleRecording ~ response:', response);
		await toggleIsBackgroundRecording();
	}
}

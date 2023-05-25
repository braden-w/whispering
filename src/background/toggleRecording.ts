import {
	getIsBackgroundRecording,
	toggleIsBackgroundRecording
} from '~lib/stores/isBackgroundRecording';
import { sendMessageToContentScript } from '~lib/utils/messaging';

export async function toggleRecording() {
	let isRecording = await getIsBackgroundRecording();
	if (!isRecording) {
		await sendMessageToContentScript({ name: 'startRecording' });
		await toggleIsBackgroundRecording();
	} else {
		await sendMessageToContentScript({ name: 'stopRecording' });
		await toggleIsBackgroundRecording();
	}
}

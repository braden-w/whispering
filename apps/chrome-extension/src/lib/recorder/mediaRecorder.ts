/**
 * This implementation uses the native mediaRecorder api.
 * Unfortunately, it didn't reliably work with Safari or Tauri.
 *
 * For the main implementation, see {@link ./recordRtcRecorder.ts}.
 */

let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];

export async function startRecording(): Promise<void> {
	const stream = await getMicrophonePermissions();
	mediaRecorder = new MediaRecorder(stream);
	mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
		recordedChunks.push(event.data);
	});
	mediaRecorder.start();
}

export async function stopRecording(): Promise<Blob> {
	return new Promise((resolve) => {
		if (!mediaRecorder) throw new Error('MediaRecorder is not initialized.');
		mediaRecorder.addEventListener('stop', () => {
			const audioBlob = new Blob(recordedChunks, { type: 'audio/wav' });
			recordedChunks = [];
			resolve(audioBlob);
		});
		mediaRecorder.stop();
	});
}

async function getMicrophonePermissions() {
	try {
		return await navigator.mediaDevices.getUserMedia({ audio: true });
	} catch (error) {
		chrome.runtime.openOptionsPage();
	}
}

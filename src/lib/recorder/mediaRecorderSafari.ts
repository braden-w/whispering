/**
 * This implementation uses the native mediaRecorder api.
 * Unfortunately, it didn't reliably work with Safari or Tauri.
 *
 * For the main implementation, see {@link ./recordRtcRecorder.ts}.
 */

let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];

export async function startRecording(): Promise<void> {
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
	mediaRecorder = new MediaRecorder(stream);
	mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
		recordedChunks.push(event.data);
	});
	mediaRecorder.start();
}

export async function stopRecording(): Promise<Blob> {
	return new Promise((resolve) => {
		if (!mediaRecorder) throw new Error('MediaRecorder is not initialized.');
		mediaRecorder.addEventListener('stop', async () => {
			const audioBlob = new Blob(recordedChunks, { type: 'audio/mp4' });
			recordedChunks = [];
			resolve(audioBlob);
		});
		mediaRecorder.stop();
	});
}

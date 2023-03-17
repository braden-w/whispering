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
		if (mediaRecorder) {
			mediaRecorder.addEventListener('stop', () => {
				const audioBlob = new Blob(recordedChunks, { type: 'audio/wav' });
				recordedChunks = [];
				resolve(audioBlob);
			});
			mediaRecorder.stop();
		} else {
			throw new Error('MediaRecorder is not initialized.');
		}
	});
}

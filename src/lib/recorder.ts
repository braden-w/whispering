import RecordRTC, { StereoAudioRecorder } from 'recordrtc';

let recorder: RecordRTC | null = null;

export async function startRecording(): Promise<void> {
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

	const options = {
		type: 'audio',
		mimeType: 'audio/wav',
		recorderType: StereoAudioRecorder,
		numberOfAudioChannels: 2,
		checkForInactiveTracks: true,
		bufferSize: 16384
	} satisfies RecordRTC.Options;

	recorder = new RecordRTC(stream, options);
	recorder.startRecording();
}

export async function stopRecording(): Promise<Blob> {
	return new Promise((resolve, reject) => {
		if (recorder) {
			recorder.stopRecording(() => {
				if (recorder) {
					const audioBlob = recorder.getBlob();
					recorder.destroy();
					recorder = null;
					resolve(audioBlob);
				} else {
					reject(new Error('Recorder is not initialized.'));
				}
			});
		} else {
			reject(new Error('Recorder is not initialized.'));
		}
	});
}

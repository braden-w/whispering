/**
 * This is the primary implementation of the recorder module.
 * It uses RecordRTC since it has better compatibility with Safari.
 *
 * For an alternative implementation, see {@link ./mediaRecorder.ts}.
 */

import RecordRTC, { StereoAudioRecorder } from 'recordrtc';

const options = {
	type: 'audio',
	mimeType: 'audio/wav',
	recorderType: StereoAudioRecorder,
	numberOfAudioChannels: 2,
	checkForInactiveTracks: true,
	bufferSize: 16384
} as RecordRTC.Options;

let recorder: RecordRTC | null = null;

export async function startRecording(): Promise<void> {
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
	recorder = new RecordRTC(stream, options);
	recorder.startRecording();
}

export async function stopRecording(): Promise<Blob> {
	return new Promise((resolve, reject) => {
		if (!recorder) throw new Error('Recorder is not initialized.');
		recorder.stopRecording(() => {
			if (!recorder) {
				reject(new Error('Recorder is not initialized.'));
				return;
			}
			const audioBlob = recorder.getBlob();
			recorder.destroy();
			recorder = null;
			resolve(audioBlob);
		});
	});
}

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
	numberOfAudioChannels: 1,
	checkForInactiveTracks: true,
	bufferSize: 256,
	sampleRate: 96000
} as RecordRTC.Options;

let recorder: RecordRTC | null = null;

export async function startRecording(): Promise<void> {
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
	recorder = new RecordRTC(stream.clone(), options);
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
			saveAudioFile(audioBlob);
			recorder.destroy();
			recorder = null;
			resolve(audioBlob);
		});
	});
}

async function saveAudioFile(blob: Blob) {
	if (!window.__TAURI__) return;
	const { writeBinaryFile, BaseDirectory } = await import('@tauri-apps/api/fs');
	const { invoke } = await import('@tauri-apps/api');
	const { appDataDir } = await import('@tauri-apps/api/path');
	const buffer = await blob.arrayBuffer();
	const uint8Array = new Uint8Array(buffer);
	const timestampIsoString = new Date().toISOString().replace(/[-:.]/g, '');
	await writeBinaryFile(`${timestampIsoString}.wav`, uint8Array, { dir: BaseDirectory.AppData });
	const appDataDirPath = await appDataDir();
	const r = await invoke('convert_to_mp3', {
		input: `${appDataDirPath}${timestampIsoString}.wav`,
		output: `${appDataDirPath}${timestampIsoString}.mp3`
	});
}

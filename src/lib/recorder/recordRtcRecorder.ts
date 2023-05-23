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
		recorder.stopRecording(async () => {
			if (!recorder) {
				reject(new Error('Recorder is not initialized.'));
				return;
			}
			const audioBlob = recorder.getBlob();
			recorder.destroy();
			recorder = null;
			try {
				const compressedBlob = await compressAudioBlob(audioBlob);
				resolve(compressedBlob);
			} catch (error) {
				resolve(audioBlob);
			}
		});
	});
}

import { readBinaryFile, writeBinaryFile, BaseDirectory, removeFile } from '@tauri-apps/api/fs';
import { invoke } from '@tauri-apps/api';
import { appDataDir } from '@tauri-apps/api/path';

async function compressAudioBlob(blob: Blob): Promise<Blob> {
	const buffer = await blob.arrayBuffer();
	const uint8Array = new Uint8Array(buffer);
	const timestampIsoString = new Date().toISOString().replace(/[-:.]/g, '');
	await writeBinaryFile(`${timestampIsoString}.wav`, uint8Array, { dir: BaseDirectory.AppData });
	const appDataDirPath = await appDataDir();
	const path = await invoke('convert_to_mp3', {
		input: `${appDataDirPath}${timestampIsoString}.wav`,
		output: `${appDataDirPath}${timestampIsoString}.mp3`
	});
	const mp3Buffer = await readBinaryFile(`${timestampIsoString}.mp3`, {
		dir: BaseDirectory.AppData
	});
	const mp3Blob = new Blob([mp3Buffer], { type: 'audio/mp3' });
	removeBothTempFiles(timestampIsoString);
	return mp3Blob;
}

/** Removes both the wav and mp3 files from the app data directory. */
async function removeBothTempFiles(fileName: string): Promise<void> {
	try {
		removeFile(`${fileName}.wav`, { dir: BaseDirectory.AppData });
		removeFile(`${fileName}.mp3`, { dir: BaseDirectory.AppData });
	} catch (error) {
		console.error(error);
	}
}

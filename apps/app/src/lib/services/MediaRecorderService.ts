import type { WhisperingErrProperties, WhisperingResult } from '@repo/shared';
import { createMediaRecorderServiceWeb } from './MediaRecorderServiceWeb';

export const MediaRecorderService = createMediaRecorderServiceWeb();

export type MediaRecorderErrProperties = WhisperingErrProperties;

export type UpdateStatusMessageFn = (args: {
	title: string;
	description: string;
}) => void;

export type RecordingSessionSettings = {
	deviceId: string;
	bitsPerSecond: number;
};

export type MediaRecorderService = {
	enumerateRecordingDevices: () => Promise<
		WhisperingResult<Pick<MediaDeviceInfo, 'deviceId' | 'label'>[]>
	>;
	initRecordingSession: (
		settings: RecordingSessionSettings,
		callbacks: { sendStatus: UpdateStatusMessageFn },
	) => Promise<WhisperingResult<void>>;
	closeRecordingSession: (
		_: undefined,
		callbacks: { sendStatus: UpdateStatusMessageFn },
	) => Promise<WhisperingResult<void>>;
	startRecording: (
		recordingId: string,
		callbacks: { sendStatus: UpdateStatusMessageFn },
	) => Promise<WhisperingResult<void>>;
	stopRecording: (
		_: undefined,
		callbacks: { sendStatus: UpdateStatusMessageFn },
	) => Promise<WhisperingResult<Blob>>;
	cancelRecording: (
		_: undefined,
		callbacks: { sendStatus: UpdateStatusMessageFn },
	) => Promise<WhisperingResult<void>>;
};

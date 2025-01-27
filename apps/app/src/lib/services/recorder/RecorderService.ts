import type { Err } from '@epicenterhq/result';
import type {
	MaybePromise,
	WhisperingRecordingState,
	WhisperingResult,
} from '@repo/shared';

export type UpdateStatusMessageFn = (args: {
	title: string;
	description: string;
}) => void;

export type RecordingSessionSettings = {
	deviceId: string;
	bitsPerSecond: number;
};

export type RecorderService = {
	getRecorderState: () => MaybePromise<
		WhisperingResult<WhisperingRecordingState>
	>;
	enumerateRecordingDevices: () => Promise<
		WhisperingResult<Pick<MediaDeviceInfo, 'deviceId' | 'label'>[]>
	>;
	ensureRecordingSession: (
		settings: RecordingSessionSettings,
		callbacks: { sendStatus: UpdateStatusMessageFn },
	) => Promise<WhisperingResult<void>>;
	closeRecordingSession: (callbacks: {
		sendStatus: UpdateStatusMessageFn;
	}) => Promise<WhisperingResult<void>>;
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

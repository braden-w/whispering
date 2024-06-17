import type { WhisperingError } from '@repo/shared';
import { Context, Effect } from 'effect';

export class MediaRecorderService extends Context.Tag('MediaRecorderService')<
	MediaRecorderService,
	{
		readonly recordingState: RecordingState;
		readonly enumerateRecordingDevices: Effect.Effect<MediaDeviceInfo[], WhisperingError, never>;
		readonly startRecording: (
			recordingDeviceId: string,
		) => Effect.Effect<void, WhisperingError, never>;
		readonly stopRecording: Effect.Effect<Blob, WhisperingError, never>;
		readonly cancelRecording: Effect.Effect<void, WhisperingError, never>;
	}
>() {}

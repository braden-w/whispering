import { Context, Data, Effect } from 'effect';
import type { WhisperingErrorProperties } from './errors';

export class MediaRecorderError extends Data.TaggedError(
	'MediaRecorderError',
)<WhisperingErrorProperties> {}

export class MediaRecorderService extends Context.Tag('MediaRecorderService')<
	MediaRecorderService,
	{
		readonly recordingState: RecordingState;
		readonly enumerateRecordingDevices: Effect.Effect<MediaDeviceInfo[], MediaRecorderError, never>;
		readonly startRecording: (
			recordingDeviceId: string,
		) => Effect.Effect<void, MediaRecorderError, never>;
		readonly stopRecording: Effect.Effect<Blob, MediaRecorderError, never>;
		readonly cancelRecording: Effect.Effect<void, MediaRecorderError, never>;
	}
>() {}

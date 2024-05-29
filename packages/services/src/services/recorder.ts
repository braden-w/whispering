import type { Effect } from 'effect';
import { Context, Data } from 'effect';

export class RecorderError extends Data.TaggedError('RecorderError')<{
	message: string;
	origError?: unknown;
}> {}

export class RecorderService extends Context.Tag('RecorderService')<
	RecorderService,
	{
		readonly startRecording: (recordingDeviceId: string) => Effect.Effect<void, RecorderError>;
		readonly cancelRecording: Effect.Effect<void, RecorderError>;
		readonly stopRecording: Effect.Effect<Blob, RecorderError>;
		readonly enumerateRecordingDevices: Effect.Effect<MediaDeviceInfo[], RecorderError>;
	}
>() {}

import type { Effect } from 'effect';
import { Context, Data } from 'effect';
import { z } from 'zod';

export const recorderStateSchema = z.union([
	z.literal('IDLE'),
	z.literal('PAUSED'),
	z.literal('RECORDING'),
]);

export type RecorderState = z.infer<typeof recorderStateSchema>;

export class RecorderError extends Data.TaggedError('RecorderError')<{
	message: string;
	origError?: unknown;
}> {}

export class RecorderService extends Context.Tag('RecorderService')<
	RecorderService,
	{
		readonly recorderState: Effect.Effect<RecorderState, RecorderError>;
		readonly startRecording: (recordingDeviceId: string) => Effect.Effect<void, RecorderError>;
		readonly cancelRecording: Effect.Effect<void, RecorderError>;
		readonly stopRecording: Effect.Effect<Blob, RecorderError>;
		readonly enumerateRecordingDevices: Effect.Effect<MediaDeviceInfo[], RecorderError>;
	}
>() {}

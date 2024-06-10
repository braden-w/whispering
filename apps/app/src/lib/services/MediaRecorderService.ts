import { Context, Data, Effect } from 'effect';
import { z } from 'zod';
import type { WhisperingErrorProperties } from './errors';

export const recorderStateSchema = z.union([z.literal('IDLE'), z.literal('RECORDING')]);

export type RecorderState = z.infer<typeof recorderStateSchema>;

export class MediaRecorderError extends Data.TaggedError(
	'MediaRecorderError',
)<WhisperingErrorProperties> {}

export class MediaRecorderService extends Context.Tag('MediaRecorderService')<
	MediaRecorderService,
	{
		readonly recorderState: RecorderState;
		readonly enumerateRecordingDevices: Effect.Effect<MediaDeviceInfo[], MediaRecorderError, never>;
		readonly startRecording: (
			recordingDeviceId: string,
		) => Effect.Effect<void, MediaRecorderError, never>;
		readonly stopRecording: Effect.Effect<Blob, MediaRecorderError, never>;
		readonly cancelRecording: Effect.Effect<void, MediaRecorderError, never>;
	}
>() {}

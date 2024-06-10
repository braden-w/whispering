import { Context, Data } from 'effect';
import { z } from 'zod';
import type { WhisperingErrorProperties } from './errors';

export const recorderStateSchema = z.union([
	z.literal('IDLE'),
	z.literal('PAUSED'),
	z.literal('RECORDING'),
]);

export type RecorderState = z.infer<typeof recorderStateSchema>;

export class RecorderError extends Data.TaggedError('RecorderError')<WhisperingErrorProperties> {}

export class RecorderService extends Context.Tag('RecorderService')<
	RecorderService,
	{
		readonly recorderState: RecorderState;
		readonly enumerateRecordingDevices: () => Promise<MediaDeviceInfo[]>;
		readonly toggleRecording: () => void;
		readonly cancelRecording: () => void;
	}
>() {}

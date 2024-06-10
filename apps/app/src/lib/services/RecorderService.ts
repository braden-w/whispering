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
	title: string;
	description?: string;
	action?: {
		label: string;
		onClick: () => void;
	};
	error?: unknown;
}> {}

export class RecorderService extends Context.Tag('RecorderService')<
	RecorderService,
	{
		readonly recorderState: RecorderState;
		readonly enumerateRecordingDevices: () => Promise<MediaDeviceInfo[]>;
		readonly toggleRecording: () => void;
		readonly cancelRecording: () => void;
	}
>() {}

import { z } from 'zod';

export type Result<T, E> =
	| {
			isSuccess: true;
			data: T;
	  }
	| {
			isSuccess: false;
			error: E;
	  };

export const recorderStateSchema = z.enum(['IDLE', 'RECORDING', 'LOADING']);

export type RecorderState = z.infer<typeof recorderStateSchema>;

export const externalMessageSchema = z.discriminatedUnion('message', [
	z.object({ message: z.literal('setRecorderState'), recorderState: recorderStateSchema }),
	z.object({ message: z.literal('transcription'), transcription: z.string() }),
]);

import { z } from 'zod';

export type WhisperingErrorProperties = {
	title: string;
	description?: string;
	action?: {
		label: string;
		onClick: () => void;
	};
	error?: unknown;
};

export type Result<T, E extends WhisperingErrorProperties = WhisperingErrorProperties> =
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
	z.object({ message: z.literal('setClipboardText'), transcription: z.string() }),
]);

export type ExternalMessage = z.infer<typeof externalMessageSchema>;

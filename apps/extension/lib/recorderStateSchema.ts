import { z } from 'zod';

export const recorderStateSchema = z.enum(['IDLE', 'LOADING', 'RECORDING']);
export type RecorderState = z.infer<typeof recorderStateSchema>;

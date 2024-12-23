import type { WhisperingResult } from '@repo/shared';
import type { z } from 'zod';
import { createHttpServiceDesktopLive } from './HttpServiceDesktopLive';
import { createHttpServiceWebLive } from './HttpServiceWebLive';

export type HttpService = {
	readonly post: <TSchema extends z.ZodTypeAny>(config: {
		url: string;
		formData: FormData;
		schema: TSchema;
		headers?: Record<string, string>;
	}) => Promise<WhisperingResult<z.infer<TSchema>>>;
};

export const HttpService = window.__TAURI_INTERNALS__
	? createHttpServiceDesktopLive()
	: createHttpServiceWebLive();

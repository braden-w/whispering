import { getExtensionFromAudioBlob } from '$lib/utils';
import { Ok } from '@epicenterhq/result';
import { z } from 'zod';
import type { HttpService } from '../http/HttpService';
import {
	HttpServiceErrIntoTranscriptionServiceErr,
	type TranscriptionService,
	TranscriptionServiceErr,
} from './TranscriptionService';

const whisperApiResponseSchema = z.union([
	z.object({ text: z.string() }),
	z.object({ error: z.object({ message: z.string() }) }),
]);

const MAX_FILE_SIZE_MB = 25 as const;

export function createWhisperService({
	HttpService,
	modelName,
	postConfig,
	preValidate,
	errorConfig,
}: {
	HttpService: HttpService;
	modelName: string;
	postConfig: { url: string; headers?: Record<string, string> };
	preValidate: () => Promise<Ok<undefined> | TranscriptionServiceErr>;
	errorConfig: { title: string; description: string };
}): TranscriptionService {
	return {
		transcribe: async (audioBlob, options) => {
			const validationResult = await preValidate();
			if (!validationResult.ok) {
				return validationResult;
			}

			const blobSizeInMb = audioBlob.size / (1024 * 1024);
			if (blobSizeInMb > MAX_FILE_SIZE_MB) {
				return TranscriptionServiceErr({
					title: `The file size (${blobSizeInMb}MB) is too large`,
					description: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
				});
			}

			const formData = new FormData();
			formData.append(
				'file',
				new File(
					[audioBlob],
					`recording.${getExtensionFromAudioBlob(audioBlob)}`,
					{ type: audioBlob.type },
				),
			);
			formData.append('model', modelName);
			if (options.outputLanguage !== 'auto') {
				formData.append('language', options.outputLanguage);
			}
			if (options.prompt) formData.append('prompt', options.prompt);
			if (options.temperature)
				formData.append('temperature', options.temperature);

			const postResult = await HttpService.post({
				url: postConfig.url,
				body: formData,
				headers: postConfig.headers,
				schema: whisperApiResponseSchema,
			});

			if (!postResult.ok) {
				return HttpServiceErrIntoTranscriptionServiceErr(postResult);
			}

			const whisperApiResponse = postResult.data;
			if ('error' in whisperApiResponse) {
				return TranscriptionServiceErr({
					title: errorConfig.title,
					description: errorConfig.description,
					action: {
						type: 'more-details',
						error: whisperApiResponse.error.message,
					},
				});
			}

			return Ok(whisperApiResponse.text.trim());
		},
	};
}

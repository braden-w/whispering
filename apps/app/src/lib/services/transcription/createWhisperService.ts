import { getExtensionFromAudioBlob } from '$lib/utils';
import { Ok } from '@epicenterhq/result';
import type { HttpService } from '../http/HttpService';
import {
	HttpServiceErrIntoTranscriptionServiceErr,
	type TranscriptionService,
	TranscriptionServiceErr,
} from './TranscriptionService';
import { whisperApiResponseSchema } from './schemas';

const MAX_FILE_SIZE_MB = 25 as const;

interface WhisperServiceConfig {
	HttpService: HttpService;
	modelName: string;
	postConfig: {
		url: string;
		headers?: Record<string, string>;
	};
	preValidate: () => Promise<Ok<undefined> | TranscriptionServiceErr>;
	errorConfig: {
		title: string;
		description: string;
	};
}

export function createWhisperService({
	HttpService,
	modelName,
	postConfig,
	preValidate,
	errorConfig,
}: WhisperServiceConfig): TranscriptionService {
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
				formData,
				url: postConfig.url,
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

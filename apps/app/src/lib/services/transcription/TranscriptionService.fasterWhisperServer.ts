import { settings } from '$lib/stores/settings.svelte.js';
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

export function createTranscriptionServiceFasterWhisperServer({
	HttpService,
}: {
	HttpService: HttpService;
}): TranscriptionService {
	return {
		transcribe: async (audioBlob, options = {}) => {
			const blobSizeInMb = audioBlob.size / (1024 * 1024);
			if (blobSizeInMb > MAX_FILE_SIZE_MB) {
				return TranscriptionServiceErr({
					title: `The file size (${blobSizeInMb}MB) is too large`,
					description: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
				});
			}
			const formDataFile = new File(
				[audioBlob],
				`recording.${getExtensionFromAudioBlob(audioBlob)}`,
				{ type: audioBlob.type },
			);
			const formData = new FormData();
			formData.append('file', formDataFile);
			formData.append('model', settings.value.fasterWhisperServerModel);
			if (settings.value.outputLanguage !== 'auto')
				formData.append('language', settings.value.outputLanguage);
			if (options.prompt) formData.append('prompt', options.prompt);
			if (options.temperature)
				formData.append('temperature', options.temperature);
			const postResult = await HttpService.post({
				url: `${settings.value.fasterWhisperServerUrl}/v1/audio/transcriptions`,
				formData,
				schema: whisperApiResponseSchema,
			});
			if (!postResult.ok) {
				return HttpServiceErrIntoTranscriptionServiceErr(postResult);
			}
			const whisperApiResponse = postResult.data;
			if ('error' in whisperApiResponse) {
				return TranscriptionServiceErr({
					title: 'faster-whisper-server error',
					description:
						'Please check your faster-whisper-server server settings',
					action: {
						type: 'more-details',
						error: whisperApiResponse.error.message,
					},
				});
			}
			return Ok(whisperApiResponse.text);
		},
	};
}

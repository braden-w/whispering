import { settings } from '$lib/stores/settings.svelte.js';
import { getExtensionFromAudioBlob } from '$lib/utils';
import { Err, Ok } from '@repo/shared/epicenter-result';
import { HttpService } from '$lib/services/http/HttpService';
import { WhisperResponseSchema } from '$lib/services/transcribe-recordings/WhisperResponseSchema';
import {
	HttpServiceErrorIntoTranscriptionServiceError,
	TranscriptionServiceErr,
	type TranscriptionService,
} from '$lib/services/transcribe-recordings/transcription/TranscriptionService';

const MAX_FILE_SIZE_MB = 25 as const;

export const createTranscriptionServiceFasterWhisperServerLive =
	(): TranscriptionService => ({
		async transcribe(audioBlob) {
			const blobSizeInMb = audioBlob.size / (1024 * 1024);
			if (blobSizeInMb > MAX_FILE_SIZE_MB) {
				return Err(
					TranscriptionServiceErr({
						title: `The file size (${blobSizeInMb}MB) is too large`,
						description: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
					}),
				);
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
			const postResult = await HttpService.post({
				url: `${settings.value.fasterWhisperServerUrl}/v1/audio/transcriptions`,
				formData,
				schema: WhisperResponseSchema,
			});
			if (!postResult.ok) {
				const error = postResult.error;
				return HttpServiceErrorIntoTranscriptionServiceError(error);
			}
			const data = postResult.data;
			if ('error' in data) {
				return TranscriptionServiceErr({
					title: 'faster-whisper-server error',
					description:
						'Please check your faster-whisper-server server settings',
					action: { type: 'more-details', error: data.error.message },
				});
			}
			return Ok(data.text);
		},
	});

export const TranscriptionServiceFasterWhisperServerLive =
	createTranscriptionServiceFasterWhisperServerLive();

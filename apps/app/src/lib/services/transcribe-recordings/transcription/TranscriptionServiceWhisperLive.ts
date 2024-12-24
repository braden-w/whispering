import {
	HttpServiceErrorIntoTranscriptionServiceError,
	type TranscriptionService,
	TranscriptionServiceErr,
} from '$lib/services/transcribe-recordings/transcription/TranscriptionService';
import { settings } from '$lib/stores/settings.svelte.js';
import { getExtensionFromAudioBlob } from '$lib/utils';
import { Ok } from '@repo/shared/epicenter-result';
import { HttpService } from '$lib/services/http/HttpService';
import { WhisperResponseSchema } from '$lib/services/transcribe-recordings/WhisperResponseSchema';

const MAX_FILE_SIZE_MB = 25 as const;

export const createTranscriptionServiceWhisperLive =
	(): TranscriptionService => ({
		async transcribe(audioBlob) {
			if (!settings.value.openAiApiKey) {
				return TranscriptionServiceErr({
					_tag: 'TranscriptionServiceErr',
					title: 'OpenAI API Key not provided.',
					description: 'Please enter your OpenAI API key in the settings',
					action: {
						type: 'link',
						label: 'Go to settings',
						goto: '/settings/transcription',
					},
				});
			}

			if (!settings.value.openAiApiKey.startsWith('sk-')) {
				return TranscriptionServiceErr({
					_tag: 'TranscriptionServiceErr',
					title: 'Invalid OpenAI API Key',
					description: 'The OpenAI API Key must start with "sk-"',
					action: {
						type: 'link',
						label: 'Update OpenAI API Key',
						goto: '/settings/transcription',
					},
				});
			}
			const blobSizeInMb = audioBlob.size / (1024 * 1024);
			if (blobSizeInMb > MAX_FILE_SIZE_MB) {
				return TranscriptionServiceErr({
					_tag: 'TranscriptionServiceErr',
					title: `The file size (${blobSizeInMb}MB) is too large`,
					description: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
				});
			}
			const formData = new FormData();
			formData.append(
				'file',
				audioBlob,
				`recording.${getExtensionFromAudioBlob(audioBlob)}`,
			);
			formData.append('model', 'whisper-1');
			if (settings.value.outputLanguage !== 'auto') {
				formData.append('language', settings.value.outputLanguage);
			}
			const postResponseResult = await HttpService.post({
				formData,
				url: 'https://api.openai.com/v1/audio/transcriptions',
				headers: { Authorization: `Bearer ${settings.value.openAiApiKey}` },
				schema: WhisperResponseSchema,
			});
			if (!postResponseResult.ok) {
				const error = postResponseResult.error;
				return HttpServiceErrorIntoTranscriptionServiceError(error);
			}
			const data = postResponseResult.data;
			if ('error' in data) {
				return TranscriptionServiceErr({
					_tag: 'TranscriptionServiceErr',
					title: 'Server error from Whisper API',
					description: 'This is likely a problem with OpenAI, not you.',
					action: { type: 'more-details', error: data.error.message },
				});
			}
			return Ok(data.text.trim());
		},
	});

export const TranscriptionServiceWhisperLive =
	createTranscriptionServiceWhisperLive();

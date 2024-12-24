import { settings } from '$lib/stores/settings.svelte.js';
import { getExtensionFromAudioBlob } from '$lib/utils';
import { Ok } from '@repo/shared';
import { HttpService } from './HttpService';
import { WhisperResponseSchema } from './transcription/WhisperResponseSchema';
import {
	HttpServiceErrorIntoTranscriptionServiceError,
	TranscriptionServiceErr,
	type TranscriptionService,
} from '$lib/services/TranscriptionService';

const MAX_FILE_SIZE_MB = 25 as const;

export const createTranscriptionServiceGroqLive = (): TranscriptionService => ({
	async transcribe(audioBlob) {
		if (!settings.value.groqApiKey) {
			return TranscriptionServiceErr({
				_tag: 'TranscriptionServiceErr',
				title: 'Groq API Key not provided.',
				description: 'Please enter your Groq API key in the settings',
				action: {
					type: 'link',
					label: 'Go to settings',
					goto: '/settings/transcription',
				},
			});
		}

		if (!settings.value.groqApiKey.startsWith('gsk_')) {
			return TranscriptionServiceErr({
				_tag: 'TranscriptionServiceErr',
				title: 'Invalid Groq API Key',
				description: 'The Groq API Key must start with "gsk_"',
				action: {
					type: 'link',
					label: 'Update API Key',
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
		const formDataFile = new File(
			[audioBlob],
			`recording.${getExtensionFromAudioBlob(audioBlob)}`,
			{ type: audioBlob.type },
		);
		const formData = new FormData();
		formData.append('file', formDataFile);
		formData.append('model', 'whisper-large-v3');
		if (settings.value.outputLanguage !== 'auto')
			formData.append('language', settings.value.outputLanguage);
		const postResult = await HttpService.post({
			url: 'https://api.groq.com/openai/v1/audio/transcriptions',
			formData,
			schema: WhisperResponseSchema,
			headers: { Authorization: `Bearer ${settings.value.groqApiKey}` },
		});
		if (!postResult.ok) {
			const error = postResult.error;
			return HttpServiceErrorIntoTranscriptionServiceError(error);
		}
		const data = postResult.data;
		if ('error' in data) {
			return TranscriptionServiceErr({
				_tag: 'TranscriptionServiceErr',
				title: 'Server error from Groq API',
				description: 'This is likely a problem with Groq, not you.',
				action: { type: 'more-details', error: data.error.message },
			});
		}
		return Ok(data.text.trim());
	},
});

export const TranscriptionServiceGroqLive =
	createTranscriptionServiceGroqLive();

import type { HttpService } from '../http/HttpService';
import {
	HttpServiceErrIntoTranscriptionServiceErr,
	type TranscriptionService,
	TranscriptionServiceErr,
} from './TranscriptionService';
import { WhisperResponseSchema } from './WhisperResponseSchema';
import { settings } from '$lib/stores/settings.svelte.js';
import { getExtensionFromAudioBlob } from '$lib/utils';
import { Ok } from '@epicenterhq/result';

const MAX_FILE_SIZE_MB = 25 as const;

export const createTranscriptionServiceWhisperLive = ({
	HttpService,
}: {
	HttpService: HttpService;
}): TranscriptionService => ({
	transcribe: async (audioBlob) => {
		if (!settings.value.openAiApiKey) {
			return TranscriptionServiceErr({
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
			return HttpServiceErrIntoTranscriptionServiceErr(postResponseResult);
		}
		const data = postResponseResult.data;
		if ('error' in data) {
			return TranscriptionServiceErr({
				title: 'Server error from Whisper API',
				description: 'This is likely a problem with OpenAI, not you.',
				action: { type: 'more-details', error: data.error.message },
			});
		}
		return Ok(data.text.trim());
	},
});

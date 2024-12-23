import { settings } from '$lib/stores/settings.svelte.js';
import { getExtensionFromAudioBlob } from '$lib/utils';
import { Ok, type TranscriptionService, WhisperingErr } from '@repo/shared';
import { HttpService } from './HttpService';
import { WhisperResponseSchema } from './transcription/WhisperResponseSchema';

const MAX_FILE_SIZE_MB = 25 as const;

export const createTranscriptionServiceGroqLive = (): TranscriptionService => ({
	async transcribe(audioBlob) {
		if (!settings.value.groqApiKey) {
			return WhisperingErr({
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
			return WhisperingErr({
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
			return WhisperingErr({
				title: `The file size (${blobSizeInMb}MB) is too large`,
				description: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
				action: { type: 'none' },
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
			switch (postResult.error._tag) {
				case 'NetworkError':
					return WhisperingErr({
						title: 'Network error',
						description: 'Please check your network connection and try again.',
						action: { type: 'more-details', error: postResult.error.message },
					});
				case 'HttpError':
					return WhisperingErr({
						title: 'Error sending audio to Groq API',
						description: 'Please check your network connection and try again.',
						action: { type: 'more-details', error: postResult.error.message },
					});
				case 'ParseError':
					return WhisperingErr({
						title: 'Error parsing response from Groq API',
						description:
							'Please check logs and notify the developer if the issue persists.',
						action: { type: 'more-details', error: postResult.error.message },
					});
			}
		}
		const data = postResult.data;
		if ('error' in data) {
			return WhisperingErr({
				title: 'Server error from Groq API',
				description: 'This is likely a problem with Groq, not you.',
				action: {
					type: 'more-details',
					error: data.error.message,
				},
			});
		}
		return Ok(data.text.trim());
	},
});

export const TranscriptionServiceGroqLive =
	createTranscriptionServiceGroqLive();

import { settings } from '$lib/stores/settings.svelte.js';
import { getExtensionFromAudioBlob } from '$lib/utils';
import { Err, Ok, type TranscriptionService } from '@repo/shared';
import { HttpService } from './HttpService';
import { WhisperResponseSchema } from './transcription/WhisperResponseSchema';

const MAX_FILE_SIZE_MB = 25 as const;

export const createTranscriptionServiceGroqLive = (): TranscriptionService => ({
	transcribe: async (audioBlob) => {
		const { groqApiKey: apiKey, outputLanguage } = settings.value;

		if (!apiKey) {
			return Err({
				_tag: 'WhisperingError',
				title: 'Groq API Key not provided.',
				description: 'Please enter your Groq API key in the settings',
				action: {
					type: 'link',
					label: 'Go to settings',
					goto: '/settings/transcription',
				},
			});
		}

		if (!apiKey.startsWith('gsk_')) {
			return Err({
				_tag: 'WhisperingError',
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
			return Err({
				_tag: 'WhisperingError',
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
		if (outputLanguage !== 'auto') formData.append('language', outputLanguage);
		const postResult = await HttpService.post({
			url: 'https://api.groq.com/openai/v1/audio/transcriptions',
			formData,
			schema: WhisperResponseSchema,
			headers: { Authorization: `Bearer ${apiKey}` },
		});
		if (!postResult.ok) {
			switch (postResult.error._tag) {
				case 'NetworkError':
					return Err({
						_tag: 'WhisperingError',
						title: 'Network error',
						description: 'Please check your network connection and try again.',
						action: { type: 'more-details', error: postResult.error.message },
					});
				case 'HttpError':
					return Err({
						_tag: 'WhisperingError',
						title: 'Error sending audio to Groq API',
						description: 'Please check your network connection and try again.',
						action: { type: 'more-details', error: postResult.error.message },
					});
				case 'ParseError':
					return Err({
						_tag: 'WhisperingError',
						title: 'Error parsing response from Groq API',
						description:
							'Please check logs and notify the developer if the issue persists.',
						action: { type: 'more-details', error: postResult.error.message },
					});
			}
		}
		const data = postResult.data;
		if ('error' in data) {
			return Err({
				_tag: 'WhisperingError',
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

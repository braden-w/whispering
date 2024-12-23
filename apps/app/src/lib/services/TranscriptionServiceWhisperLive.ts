import { settings } from '$lib/stores/settings.svelte.js';
import { getExtensionFromAudioBlob } from '$lib/utils';
import { Ok, type TranscriptionService, WhisperingErr } from '@repo/shared';
import { HttpService } from './HttpService';
import { WhisperResponseSchema } from './transcription/WhisperResponseSchema';

const MAX_FILE_SIZE_MB = 25 as const;

export const createTranscriptionServiceWhisperLive =
	(): TranscriptionService => ({
		async transcribe(audioBlob) {
			if (!settings.value.openAiApiKey) {
				return WhisperingErr({
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
				return WhisperingErr({
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
				return WhisperingErr({
					title: `The file size (${blobSizeInMb}MB) is too large`,
					description: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
					action: { type: 'none' },
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
				switch (error._tag) {
					case 'NetworkError':
						return WhisperingErr({
							title: 'Network error',
							description:
								'Please check your network connection and try again.',
							action: { type: 'none' },
						});
					case 'HttpError':
						return WhisperingErr({
							title: 'Error sending audio to OpenAI API',
							description:
								'Please check your network connection and try again.',
							action: { type: 'none' },
						});
					case 'ParseError':
						return WhisperingErr({
							title: 'Error parsing response from OpenAI API',
							description:
								'Please check logs and notify the developer if the issue persists.',
							action: { type: 'none' },
						});
				}
			}
			const data = postResponseResult.data;
			if ('error' in data) {
				return WhisperingErr({
					title: 'Server error from Whisper API',
					description: 'This is likely a problem with OpenAI, not you.',
					action: {
						type: 'more-details',
						error: data.error.message,
					},
				});
			}
			return Ok(data.text.trim());
		},
	});

export const TranscriptionServiceWhisperLive =
	createTranscriptionServiceWhisperLive();

import { settings } from '$lib/stores/settings.svelte.js';
import { getExtensionFromAudioBlob } from '$lib/utils';
import { Err, Ok, type TranscriptionService } from '@repo/shared';
import { HttpService } from './HttpService';
import { WhisperResponseSchema } from './transcription/WhisperResponseSchema';

const MAX_FILE_SIZE_MB = 25 as const;

export const createTranscriptionServiceFasterWhisperServerLive =
	(): TranscriptionService => ({
		async transcribe(audioBlob) {
			const blobSizeInMb = audioBlob.size / (1024 * 1024);
			if (blobSizeInMb > MAX_FILE_SIZE_MB) {
				return Err({
					_tag: 'WhisperingError',
					title: `The file size (${blobSizeInMb}MB) is too large`,
					description: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
					action: {
						type: 'none',
					},
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
			const postResult = await HttpService.post({
				url: `${settings.value.fasterWhisperServerUrl}/v1/audio/transcriptions`,
				formData,
				schema: WhisperResponseSchema,
			});
			if (!postResult.ok) {
				switch (postResult.error._tag) {
					case 'NetworkError':
						return Err({
							_tag: 'WhisperingError',
							title: 'Network error',
							description: 'Please check your internet connection',
							action: { type: 'more-details', error: postResult.error.message },
						});
					case 'HttpError':
						return Err({
							_tag: 'WhisperingError',
							title:
								'An error occurred while sending the request to the transcription server.',
							description: 'Please try again',
							action: { type: 'more-details', error: postResult.error.message },
						});
					case 'ParseError':
						return Err({
							_tag: 'WhisperingError',
							title: 'Unable to parse transcription server response',
							description: 'Please try again',
							action: { type: 'more-details', error: postResult.error.message },
						});
				}
			}
			const data = postResult.data;
			if ('error' in data) {
				return Err({
					_tag: 'WhisperingError',
					title: 'faster-whisper-server error',
					description:
						'Please check your faster-whisper-server server settings',
					action: {
						type: 'more-details',
						error: data.error.message,
					},
				});
			}
			return Ok(data.text);
		},
	});

export const TranscriptionServiceFasterWhisperServerLive =
	createTranscriptionServiceFasterWhisperServerLive();

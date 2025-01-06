import { Ok } from '@epicenterhq/result';
import type { HttpService } from '../http/HttpService';
import {
	TranscriptionServiceErr,
	type TranscriptionService,
} from './TranscriptionService';
import { createWhisperService } from './createWhisperService';
import type { Settings } from '@repo/shared';

/**
 * Best accuracy (10.3% WER) and full multilingual support, including translation.
 * Recommended for error-sensitive applications requiring multilingual support.
 * Cost: $0.111/hour
 */
export function createTranscriptionServiceGroqLarge({
	HttpService,
	settings,
}: {
	HttpService: HttpService;
	settings: Settings;
}): TranscriptionService {
	return createWhisperService({
		HttpService,
		modelName: 'whisper-large-v3',
		postConfig: {
			url: 'https://api.groq.com/openai/v1/audio/transcriptions',
			headers: {
				Authorization: `Bearer ${settings['apiKeys.groq']}`,
			},
		},
		preValidate: async () => {
			if (!settings['apiKeys.groq']) {
				return TranscriptionServiceErr({
					title: 'Groq API Key not provided.',
					description: 'Please enter your Groq API key in the settings',
					action: {
						type: 'link',
						label: 'Go to settings',
						goto: '/settings/transcription',
					},
				});
			}

			if (!settings['apiKeys.groq'].startsWith('gsk_')) {
				return TranscriptionServiceErr({
					title: 'Invalid Groq API Key',
					description: 'The Groq API Key must start with "gsk_"',
					action: {
						type: 'link',
						label: 'Update API Key',
						goto: '/settings/transcription',
					},
				});
			}

			return Ok(undefined);
		},
		errorConfig: {
			title: 'Server error from Groq API',
			description: 'This is likely a problem with Groq, not you.',
		},
	});
}

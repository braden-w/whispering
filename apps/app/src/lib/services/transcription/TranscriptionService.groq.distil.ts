import { Ok } from '@epicenterhq/result';
import type { HttpService } from '../http/HttpService';
import {
	TranscriptionServiceErr,
	type TranscriptionService,
} from './TranscriptionService';
import { createWhisperService } from './createWhisperService';
import type { Settings } from '@repo/shared';

/**
 * Fastest and most cost-effective model, but English-only.
 * Recommended for English transcription where speed and cost are priorities.
 * Cost: $0.02/hour, 250x real-time processing, 13% WER
 */
export function createTranscriptionServiceGroqDistil({
	HttpService,
	settings,
}: {
	HttpService: HttpService;
	settings: Settings;
}): TranscriptionService {
	return createWhisperService({
		HttpService,
		modelName: 'distil-whisper-large-v3-en',
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

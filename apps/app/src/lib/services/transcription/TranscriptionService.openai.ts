import { Ok } from '@epicenterhq/result';
import type { HttpService } from '../http/HttpService';
import {
	TranscriptionServiceErr,
	type TranscriptionService,
} from './TranscriptionService';
import { createWhisperService } from './createWhisperService';
import type { Settings } from '@repo/shared';

export function createTranscriptionServiceOpenAi({
	HttpService,
	settings,
}: {
	HttpService: HttpService;
	settings: Settings;
}): TranscriptionService {
	return createWhisperService({
		HttpService,
		modelName: 'whisper-1',
		postConfig: {
			url: 'https://api.openai.com/v1/audio/transcriptions',
			headers: {
				Authorization: `Bearer ${settings['apiKeys.openai']}`,
			},
		},
		preValidate: async () => {
			if (!settings['apiKeys.openai']) {
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

			if (!settings['apiKeys.openai'].startsWith('sk-')) {
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

			return Ok(undefined);
		},
		errorConfig: {
			title: 'Server error from Whisper API',
			description: 'This is likely a problem with OpenAI, not you.',
		},
	});
}

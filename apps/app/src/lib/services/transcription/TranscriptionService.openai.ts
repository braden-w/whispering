import { settings } from '$lib/stores/settings.svelte.js';
import { Ok } from '@epicenterhq/result';
import type { HttpService } from '../http/HttpService';
import {
	TranscriptionServiceErr,
	type TranscriptionService,
} from './TranscriptionService';
import { createWhisperService } from './createWhisperService';

export function createTranscriptionServiceOpenAi({
	HttpService,
}: {
	HttpService: HttpService;
}): TranscriptionService {
	return createWhisperService({
		HttpService,
		modelName: 'whisper-1',
		postConfig: {
			url: 'https://api.openai.com/v1/audio/transcriptions',
			headers: {
				Authorization: `Bearer ${settings.value['apiKeys.openai']}`,
			},
		},
		preValidate: async () => {
			if (!settings.value['apiKeys.openai']) {
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

			if (!settings.value['apiKeys.openai'].startsWith('sk-')) {
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

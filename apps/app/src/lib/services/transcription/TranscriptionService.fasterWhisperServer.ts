import { settings } from '$lib/stores/settings.svelte.js';
import { Ok } from '@epicenterhq/result';
import type { HttpService } from '../http/HttpService';
import {
	TranscriptionServiceErr,
	type TranscriptionService,
} from './TranscriptionService';
import { createWhisperService } from './createWhisperService';

export function createTranscriptionServiceFasterWhisperServer({
	HttpService,
}: {
	HttpService: HttpService;
}): TranscriptionService {
	return createWhisperService({
		HttpService,
		modelName: settings.value['transcription.fasterWhisperServer.serverModel'],
		postConfig: {
			url: `${settings.value['transcription.fasterWhisperServer.serverUrl']}/v1/audio/transcriptions`,
		},
		preValidate: async () => Ok(undefined),
		errorConfig: {
			title: 'faster-whisper-server error',
			description: 'Please check your faster-whisper-server server settings',
		},
	});
}

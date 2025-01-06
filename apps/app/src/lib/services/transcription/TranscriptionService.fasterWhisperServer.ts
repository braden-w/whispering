import { Ok } from '@epicenterhq/result';
import type { HttpService } from '../http/HttpService';
import {
	TranscriptionServiceErr,
	type TranscriptionService,
} from './TranscriptionService';
import { createWhisperService } from './createWhisperService';
import type { Settings } from '@repo/shared';

export function createTranscriptionServiceFasterWhisperServer({
	HttpService,
	settings,
}: {
	HttpService: HttpService;
	settings: Settings;
}): TranscriptionService {
	return createWhisperService({
		HttpService,
		modelName: settings['transcription.fasterWhisperServer.serverModel'],
		postConfig: {
			url: `${settings['transcription.fasterWhisperServer.serverUrl']}/v1/audio/transcriptions`,
		},
		preValidate: async () => Ok(undefined),
		errorConfig: {
			title: 'faster-whisper-server error',
			description: 'Please check your faster-whisper-server server settings',
		},
	});
}

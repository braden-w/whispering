import { Ok } from '@epicenterhq/result';
import type { Settings } from '@repo/shared';
import type { HttpService } from '../http/HttpService';
import type { TranscriptionService } from './TranscriptionService';
import { createWhisperService } from './createWhisperService';

export function createFasterWhisperServerTranscriptionService({
	HttpService,
	serverModel,
	serverUrl,
}: {
	HttpService: HttpService;
	serverModel: string;
	serverUrl: string;
}): TranscriptionService {
	return createWhisperService({
		HttpService,
		modelName: serverModel,
		postConfig: {
			url: `${serverUrl}/v1/audio/transcriptions`,
		},
		preValidate: async () => Ok(undefined),
		errorConfig: {
			title: 'faster-whisper-server error',
			description: 'Please check your faster-whisper-server server settings',
		},
	});
}

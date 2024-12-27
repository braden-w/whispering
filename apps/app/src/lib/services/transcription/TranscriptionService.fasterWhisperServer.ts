import type { HttpService } from '../http/HttpService';
import {
	HttpServiceErrIntoTranscriptionServiceErr,
	type TranscriptionService,
	TranscriptionServiceErr,
} from './TranscriptionService';
import { WhisperResponseSchema } from './WhisperResponseSchema';
import { settings } from '$lib/stores/settings.svelte.js';
import { getExtensionFromAudioBlob } from '$lib/utils';
import { Ok } from '@epicenterhq/result';

const MAX_FILE_SIZE_MB = 25 as const;

export const createTranscriptionServiceFasterWhisperServerLive = ({
	HttpService,
}: {
	HttpService: HttpService;
}): TranscriptionService => ({
	transcribe: async (audioBlob) => {
		const blobSizeInMb = audioBlob.size / (1024 * 1024);
		if (blobSizeInMb > MAX_FILE_SIZE_MB) {
			return TranscriptionServiceErr({
				title: `The file size (${blobSizeInMb}MB) is too large`,
				description: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
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
			return HttpServiceErrIntoTranscriptionServiceErr(postResult);
		}
		const data = postResult.data;
		if ('error' in data) {
			return TranscriptionServiceErr({
				title: 'faster-whisper-server error',
				description: 'Please check your faster-whisper-server server settings',
				action: { type: 'more-details', error: data.error.message },
			});
		}
		return Ok(data.text);
	},
});

import { Ok } from '@epicenterhq/result';
import { settings } from '$lib/stores/settings.svelte';
import type { WhisperingResult } from '@repo/shared';
import { type Recording, recordings, RecordingsService } from './services/db';
import { renderErrAsToast } from './services/renderErrorAsToast';
import { createTranscriptionServiceFasterWhisperServerLive } from './services/transcription/TranscriptionServiceFasterWhisperServerLive';
import { createTranscriptionServiceGroqLive } from './services/transcription/TranscriptionServiceGroqLive';
import { createTranscriptionServiceWhisperLive } from './services/transcription/TranscriptionServiceWhisperLive';
import { HttpService } from './services/http/HttpService';

export const transcriptionManager = createTranscriptionManager();
function createTranscriptionManager() {
	return {
		get isCurrentlyTranscribing() {
			return transcribingRecordingIds.size > 0;
		},
		transcribeRecordingAndUpdateDb: async (
			recording: Recording,
		): Promise<WhisperingResult<Recording>> => {
			const selectedTranscriptionService = {
				OpenAI: TranscriptionServiceWhisperLive,
				Groq: TranscriptionServiceGroqLive,
				'faster-whisper-server': TranscriptionServiceFasterWhisperServerLive,
			}[settings.value.selectedTranscriptionService];

			const setStatusTranscribingResult =
				await RecordingsService.updateRecording({
					...recording,
					transcriptionStatus: 'TRANSCRIBING',
				});

			if (!setStatusTranscribingResult.ok)
				renderErrAsToast({
					title: '❌ Failed to Update Recording',
					description:
						'Your recording was saved but we encountered an issue while updating the recording with the transcription status. You may need to restart the application.',
					action: {
						type: 'more-details',
						error: setStatusTranscribingResult.error,
					},
				});

			transcribingRecordingIds.add(recording.id);
			const transcribeResult = await selectedTranscriptionService.transcribe(
				recording.blob,
			);
			transcribingRecordingIds.delete(recording.id);

			if (!transcribeResult.ok) return transcribeResult;
			const transcribedText = transcribeResult.data;
			const newRecording = {
				...recording,
				transcriptionStatus: 'DONE',
				transcribedText,
			} satisfies Recording;
			const setStatusDoneResult =
				await recordings.updateRecording(newRecording);
			if (!setStatusDoneResult.ok)
				renderErrAsToast({
					title: '❌ Failed to Update Recording',
					description:
						'Your recording was saved but we encountered an issue while updating the recording with the transcription result. You may need to restart the application.',
					action: {
						type: 'more-details',
						error: setStatusDoneResult.error,
					},
				});
			return Ok(newRecording);
		},
	};
}

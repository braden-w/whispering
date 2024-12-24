import { ClipboardService } from '$lib/services/clipboard/ClipboardService';
import type { Recording, RecordingsErrorProperties } from '$lib/services/db/';
import type {
	TranscriptionService,
	TranscriptionServiceErrProperties,
} from '$lib/services/TranscriptionService';
import { TranscriptionServiceFasterWhisperServerLive } from '$lib/services/TranscriptionServiceFasterWhisperServerLive';
import { TranscriptionServiceGroqLive } from '$lib/services/TranscriptionServiceGroqLive';
import { TranscriptionServiceWhisperLive } from '$lib/services/TranscriptionServiceWhisperLive';
import { Ok, type ServiceFn } from '@repo/shared/epicenter-result';
import { RecordingsService } from '../services/recordings/RecordingsDbService.svelte';
import { settings } from '../../stores/settings.svelteings.svelte';

export const TranscribeAndUpdateService = createTranscribeAndUpdateService({
	TranscriptionService: TranscriptionServiceWhisperLive,
	RecordingsService: RecordingsService,
});

type TranscribeAndUpdateService = {
	readonly currentTranscribingRecordingIds: Set<string>;
	transcribeAndUpdateRecording: ServiceFn<
		Recording,
		string,
		TranscriptionServiceErrProperties | RecordingsErrorProperties
	>;
	transcribeAndUpdateRecordingAndCopyToClipboard: ServiceFn<
		Recording,
		string,
		TranscriptionServiceErrProperties | RecordingsErrorProperties
	>;
	transcribeAndUpdateRecordingAndCopyToClipboardAndPasteToCursor: ServiceFn<
		Recording,
		string,
		TranscriptionServiceErrProperties | RecordingsErrorProperties
	>;
};

function createTranscribeAndUpdateService({
	TranscriptionService,
	RecordingsService,
}: {
	TranscriptionService: TranscriptionService;
	RecordingsService: RecordingsService;
}) {
	const transcribingRecordingIds = new Set<string>();

	async function transcribeAndUpdateRecording(recording: Recording) {
		const selectedTranscriptionService = {
			OpenAI: TranscriptionServiceWhisperLive,
			Groq: TranscriptionServiceGroqLive,
			'faster-whisper-server': TranscriptionServiceFasterWhisperServerLive,
		}[settings.value.selectedTranscriptionService];

		transcribingRecordingIds.add(recording.id);
		const transcribeResult = await selectedTranscriptionService.transcribe(
			recording.blob,
		);
		transcribingRecordingIds.delete(recording.id);

		if (!transcribeResult.ok) return transcribeResult;

		const transcribedText = transcribeResult.data;
		const newRecordingWithDoneStatus = {
			...recording,
			transcriptionStatus: 'DONE',
			transcribedText,
		} satisfies Recording;
		const updateRecordingWithDoneStatusResult =
			await RecordingsService.updateRecording(newRecordingWithDoneStatus);
		if (!updateRecordingWithDoneStatusResult.ok)
			return updateRecordingWithDoneStatusResult;

		return Ok(transcribedText);
	}

	async function transcribeAndUpdateRecordingAndCopyToClipboard(
		recording: Recording,
	) {
		const transcribeAndUpdateResult =
			await transcribeAndUpdateRecording(recording);
		if (!transcribeAndUpdateResult.ok) return transcribeAndUpdateResult;
		const transcribedText = transcribeAndUpdateResult.data;
		if (transcribedText === '') return Ok(transcribedText);

		const setClipboardTextResult =
			await ClipboardService.setClipboardText(transcribedText);
		if (!setClipboardTextResult.ok) return setClipboardTextResult;

		return Ok(transcribedText);
	}

	async function transcribeAndUpdateRecordingAndCopyToClipboardAndPasteToCursor(
		recording: Recording,
	) {
		const transcribeAndUpdateAndCopyToClipboardResult =
			await transcribeAndUpdateRecordingAndCopyToClipboard(recording);
		if (!transcribeAndUpdateAndCopyToClipboardResult.ok)
			return transcribeAndUpdateAndCopyToClipboardResult;

		const transcribedText = transcribeAndUpdateAndCopyToClipboardResult.data;

		const pasteToCursorResult =
			await ClipboardService.writeTextToCursor(transcribedText);
		if (!pasteToCursorResult.ok) return pasteToCursorResult;

		return Ok(transcribedText);
	}

	return {
		get currentTranscribingRecordingIds() {
			return transcribingRecordingIds;
		},
		transcribeAndUpdateRecording,
		transcribeAndUpdateRecordingAndCopyToClipboard,
		transcribeAndUpdateRecordingAndCopyToClipboardAndPasteToCursor,
	};
}

import { ClipboardService } from '$lib/services/ClipboardService';
import type {
	Recording,
	RecordingsDbServiceErrorProperties,
} from '$lib/services/RecordingDbService';
import type {
	TranscriptionService,
	TranscriptionServiceErrProperties,
} from '$lib/services/TranscriptionService';
import { TranscriptionServiceFasterWhisperServerLive } from '$lib/services/TranscriptionServiceFasterWhisperServerLive';
import { TranscriptionServiceGroqLive } from '$lib/services/TranscriptionServiceGroqLive';
import { TranscriptionServiceWhisperLive } from '$lib/services/TranscriptionServiceWhisperLive';
import { Ok, type Result, type ServiceFn } from '@epicenterhq/result';
import { RecordingsService } from './RecordingsService.svelte';
import { settings } from './settings.svelte';

export const TranscribeAndUpdateService = createTranscribeAndUpdateService({
	TranscriptionService: TranscriptionServiceWhisperLive,
	RecordingsService: RecordingsService,
});

type TranscribeAndUpdateService = {
	readonly currentTranscribingRecordingIds: Set<string>;
	transcribeAndUpdateRecording: ServiceFn<
		Recording,
		string,
		TranscriptionServiceErrProperties | RecordingsDbServiceErrorProperties
	>;
	transcribeAndUpdateRecordingAndCopyToClipboard: ServiceFn<
		Recording,
		string,
		TranscriptionServiceErrProperties | RecordingsDbServiceErrorProperties
	>;
	transcribeAndUpdateRecordingAndCopyToClipboardAndPasteToCursor: ServiceFn<
		Recording,
		string,
		TranscriptionServiceErrProperties | RecordingsDbServiceErrorProperties
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

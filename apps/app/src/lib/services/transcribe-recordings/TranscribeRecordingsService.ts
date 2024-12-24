import { ClipboardService } from '$lib/services/clipboard/ClipboardService';
import { settings } from '$lib/stores/settings.svelte';
import { Ok, type Result } from '@epicenterhq/result';
import { RecordingsService } from '../recordings-db/RecordingsService.svelte';
import type { DbServiceErr, Recording } from '../recordings-db/db/DbService';
import type {
	TranscriptionService,
	TranscriptionServiceErr,
} from './transcription/TranscriptionService';
import { TranscriptionServiceFasterWhisperServerLive } from './transcription/TranscriptionServiceFasterWhisperServerLive';
import { TranscriptionServiceGroqLive } from './transcription/TranscriptionServiceGroqLive';
import { TranscriptionServiceWhisperLive } from './transcription/TranscriptionServiceWhisperLive';

export const TranscribeAndUpdateService = createTranscribeAndUpdateService({
	TranscriptionService: TranscriptionServiceWhisperLive,
	RecordingsService: RecordingsService,
});

type TranscribeRecordingsServiceResult =
	| Result<TranscribeRecordingsService, never>
	| DbServiceErr
	| TranscriptionServiceErr;

type TranscribeRecordingsService = {
	readonly currentTranscribingRecordingIds: Set<string>;
	readonly transcribeAndUpdateRecording: (
		recording: Recording,
	) => Promise<TranscribeRecordingsServiceResult>;
	readonly transcribeAndUpdateRecordingAndCopyToClipboard: (
		recording: Recording,
	) => Promise<TranscribeRecordingsServiceResult>;
	readonly transcribeAndUpdateRecordingAndCopyToClipboardAndPasteToCursor: (
		recording: Recording,
	) => Promise<TranscribeRecordingsServiceResult>;
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

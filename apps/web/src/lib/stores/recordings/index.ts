import { RecordingsDb, type Recording, RecordingNotFound } from '@repo/recorder';
import { Data, Effect } from 'effect';
import { get, writable } from 'svelte/store';
import { apiKey } from '../apiKey';

export function createRecordings() {
	const { subscribe, set, update } = writable<Recording[]>([]);
	const editRecording = (id: string, recording: Recording) =>
		Effect.gen(function* (_) {
			const recordingsDb = yield* _(RecordingsDb);
			yield* _(recordingsDb.editRecording(id, recording));
			update((recordings) => {
				const index = recordings.findIndex((recording) => recording.id === id);
				if (index === -1) return recordings;
				recordings[index] = recording;
				return recordings;
			});
		});
	return {
		subscribe,
		sync: Effect.gen(function* (_) {
			const recordingsDb = yield* _(RecordingsDb);
			const recordings = yield* _(recordingsDb.getAllRecordings);
			set(recordings);
		}),
		addRecording: (recording: Recording) =>
			Effect.gen(function* (_) {
				const recordingsDb = yield* _(RecordingsDb);
				yield* _(recordingsDb.addRecording(recording));
				update((recordings) => [...recordings, recording]);
			}),
		editRecording,
		deleteRecording: (id: string) =>
			Effect.gen(function* (_) {
				const recordingsDb = yield* _(RecordingsDb);
				yield* _(recordingsDb.deleteRecording(id));
				update((recordings) => recordings.filter((recording) => recording.id !== id));
			}),
		transcribeRecording: (id: string) =>
			Effect.gen(function* (_) {
				const $apiKey = get(apiKey);
				const recordingsDb = yield* _(RecordingsDb);
				const recording = yield* _(recordingsDb.getRecording(id));
				if (!recording) return yield* _(new RecordingNotFound({ id }));
				editRecording(id, { ...recording, state: 'TRANSCRIBING' });
				const transcription = yield* _(transcribeAudioWithWhisperApi(recording.blob, $apiKey));
				editRecording(id, { ...recording, state: 'DONE' });
				yield* _(recordingsDb.editRecording(id, { ...recording, transcription }));
			})
	};
}

const transcribeAudioWithWhisperApi = (audioBlob: Blob, WHISPER_API_KEY: string) =>
	Effect.gen(function* (_) {
		if (audioBlob.size > 25 * 1024 * 1024) {
			return yield* _(
				new WhisperFileTooLarge({
					message: 'The file is too large. Please upload a file smaller than 25MB.'
				})
			);
		}
		const fileName = 'recording.wav';
		const wavFile = new File([audioBlob], fileName);
		const formData = new FormData();
		formData.append('file', wavFile);
		formData.append('model', 'whisper-1');
		const data = yield* _(
			Effect.tryPromise({
				try: () =>
					fetch('https://api.openai.com/v1/audio/transcriptions', {
						method: 'POST',
						headers: { Authorization: `Bearer ${WHISPER_API_KEY}` },
						body: formData
					}).then((res) => res.json()),
				catch: (error) => new WhisperFetchError({ origError: error })
			})
		);
		console.log('🚀 ~ Effect.gen ~ data:', data);
		return data.text;
	});

class WhisperFileTooLarge extends Data.TaggedError('WhisperFileTooLarge')<{
	message: string;
}> {}

class WhisperFetchError extends Data.TaggedError('WhisperFetchError')<{
	origError: unknown;
}> {}

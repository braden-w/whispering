import { Effect } from 'effect';
import { Context, Data } from 'effect';

export class TranscriptionService extends Context.Tag('TranscriptionService')<
	TranscriptionService,
	{
		readonly transcribe: (blob: Blob) => Effect.Effect<string, TranscribeError>;
	}
>() {}

class TranscribeError extends Data.TaggedError('TranscribeError')<{
	origError: unknown;
}> {}

export const transcribeAudioWithWhisperApi = (audioBlob: Blob, WHISPER_API_KEY: string) =>
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

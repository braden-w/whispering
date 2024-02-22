import type { Context } from 'effect';
import { Data, Effect } from 'effect';
import type { TranscriptionService } from '.';

function isString(input: unknown): input is string {
	return typeof input === 'string';
}

export const whisperTranscriptionService: Context.Tag.Service<TranscriptionService> = {
	transcribe: (blob) =>
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
			if (!isString(data.text)) {
				return yield* _(new TranscriptionIsNotStringError({ transcription: data.text }));
			}
			return data.text;
		})
};

class WhisperFileTooLarge extends Data.TaggedError('WhisperFileTooLarge')<{
	message: string;
}> {}

class WhisperFetchError extends Data.TaggedError('WhisperFetchError')<{
	origError: unknown;
}> {}

class TranscriptionIsNotStringError extends Data.TaggedError('TranscriptionIsNotStringError')<{
	transcription: unknown;
}> {}

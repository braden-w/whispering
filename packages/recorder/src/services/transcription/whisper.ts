import type { Context } from 'effect';
import { Effect } from 'effect';
import { TranscriptionError, type TranscriptionService } from '.';

function isString(input: unknown): input is string {
	return typeof input === 'string';
}

const MAX_FILE_SIZE_MB = 25 as const;

export const whisperTranscriptionService: Context.Tag.Service<TranscriptionService> = {
	transcribe: (audioBlob, { apiKey }: { apiKey: string }) =>
		Effect.gen(function* (_) {
			const blobSizeInMb = audioBlob.size / (1024 * 1024);
			if (blobSizeInMb > MAX_FILE_SIZE_MB) {
				return yield* _(new WhisperFileTooLarge(blobSizeInMb, MAX_FILE_SIZE_MB));
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
							headers: { Authorization: `Bearer ${apiKey}` },
							body: formData
						}).then((res) => res.json()),
					catch: (error) => new WhisperFetchError({ origError: error })
				})
			);
			if (!isString(data.text)) {
				return yield* _(new TranscriptionIsNotStringError());
			}
			return data.text;
		})
};

class WhisperFileTooLarge extends TranscriptionError {
	constructor(fileSizeMb: number, maxFileSizeMb: number) {
		super({
			message: `The file size (${fileSizeMb}MB) is too large. Please upload a file smaller than ${maxFileSizeMb}MB.`
		});
	}
}

class WhisperFetchError extends TranscriptionError {
	constructor(fetchError: unknown) {
		super({
			message: 'Failed to fetch transcription from Whisper API',
			origError: fetchError
		});
	}
}

class TranscriptionIsNotStringError extends TranscriptionError {
	constructor() {
		super({
			message: 'Transcrition from Whisper API is invalid or not a string'
		});
	}
}

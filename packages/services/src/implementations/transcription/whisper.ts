import { Effect, Layer } from 'effect';
import {
	InvalidApiKeyError,
	PleaseEnterApiKeyError,
	TranscriptionError,
	TranscriptionService
} from '../../services/transcription';

class WhisperFileTooLarge extends TranscriptionError {
	constructor(fileSizeMb: number, maxFileSizeMb: number) {
		super({
			message: `The file size (${fileSizeMb}MB) is too large. Please upload a file smaller than ${maxFileSizeMb}MB.`
		});
	}
}

class WhisperFetchError extends TranscriptionError {
	constructor({ fetchError }: { fetchError: unknown }) {
		super({
			message: 'Failed to fetch transcription from Whisper API',
			origError: fetchError
		});
	}
}

class WhisperServerError extends TranscriptionError {
	constructor({ message, code, type }: { message: string; code?: string; type?: string }) {
		super({
			message: `Server error from Whisper API: ${message}\nCode: ${code}\nType: ${type}`
		});
	}
}

class TranscriptionIsNotStringError extends TranscriptionError {
	constructor() {
		super({
			message: 'Transcription from Whisper API is invalid or not a string'
		});
	}
}

function isString(input: unknown): input is string {
	return typeof input === 'string';
}

const MAX_FILE_SIZE_MB = 25 as const;
const FILE_NAME = 'recording.wav';

/** Supported languages pulled from OpenAI Website: https://platform.openai.com/docs/guides/speech-to-text/supported-languages */
const SUPPORTED_LANGUAGES = [
	'Afrikaans',
	'Arabic',
	'Armenian',
	'Azerbaijani',
	'Belarusian',
	'Bosnian',
	'Bulgarian',
	'Catalan',
	'Chinese',
	'Croatian',
	'Czech',
	'Danish',
	'Dutch',
	'English',
	'Estonian',
	'Finnish',
	'French',
	'Galician',
	'German',
	'Greek',
	'Hebrew',
	'Hindi',
	'Hungarian',
	'Icelandic',
	'Indonesian',
	'Italian',
	'Japanese',
	'Kannada',
	'Kazakh',
	'Korean',
	'Latvian',
	'Lithuanian',
	'Macedonian',
	'Malay',
	'Marathi',
	'Maori',
	'Nepali',
	'Norwegian',
	'Persian',
	'Polish',
	'Portuguese',
	'Romanian',
	'Russian',
	'Serbian',
	'Slovak',
	'Slovenian',
	'Spanish',
	'Swahili',
	'Swedish',
	'Tagalog',
	'Tamil',
	'Thai',
	'Turkish',
	'Ukrainian',
	'Urdu',
	'Vietnamese',
	'Welsh'
] as const;

export const TranscriptionServiceLiveWhisper = Layer.succeed(
	TranscriptionService,
	TranscriptionService.of({
		getSupportedOutputLanguages: Effect.succeed(SUPPORTED_LANGUAGES),
		transcribe: (audioBlob, { apiKey, outputLanguage }) =>
			Effect.gen(function* (_) {
				if (!apiKey) {
					return yield* _(new PleaseEnterApiKeyError());
				}
				if (!apiKey.startsWith('sk-')) {
					return yield* _(new InvalidApiKeyError());
				}
				const blobSizeInMb = audioBlob.size / (1024 * 1024);
				if (blobSizeInMb > MAX_FILE_SIZE_MB) {
					return yield* _(new WhisperFileTooLarge(blobSizeInMb, MAX_FILE_SIZE_MB));
				}
				const wavFile = new File([audioBlob], FILE_NAME);
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
						catch: (error) => new WhisperFetchError({ fetchError: error })
					})
				);
				if (data?.error?.message) {
					return yield* _(
						new WhisperServerError({
							message: data.error.message,
							code: data.error.code,
							type: data.error.type
						})
					);
				}
				if (!isString(data.text)) {
					return yield* _(new TranscriptionIsNotStringError());
				}
				return data.text;
			})
	})
);
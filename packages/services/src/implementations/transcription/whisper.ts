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
	{ label: 'Afrikaans', code: 'af' },
	{ label: 'Arabic', code: 'ar' },
	{ label: 'Armenian', code: 'hy' },
	{ label: 'Azerbaijani', code: 'az' },
	{ label: 'Belarusian', code: 'be' },
	{ label: 'Bosnian', code: 'bs' },
	{ label: 'Bulgarian', code: 'bg' },
	{ label: 'Catalan', code: 'ca' },
	{ label: 'Chinese', code: 'zh' },
	{ label: 'Croatian', code: 'hr' },
	{ label: 'Czech', code: 'cs' },
	{ label: 'Danish', code: 'da' },
	{ label: 'Dutch', code: 'nl' },
	{ label: 'English', code: 'en' },
	{ label: 'Estonian', code: 'et' },
	{ label: 'Finnish', code: 'fi' },
	{ label: 'French', code: 'fr' },
	{ label: 'Galician', code: 'gl' },
	{ label: 'German', code: 'de' },
	{ label: 'Greek', code: 'el' },
	{ label: 'Hebrew', code: 'he' },
	{ label: 'Hindi', code: 'hi' },
	{ label: 'Hungarian', code: 'hu' },
	{ label: 'Icelandic', code: 'is' },
	{ label: 'Indonesian', code: 'id' },
	{ label: 'Italian', code: 'it' },
	{ label: 'Japanese', code: 'ja' },
	{ label: 'Kannada', code: 'kn' },
	{ label: 'Kazakh', code: 'kk' },
	{ label: 'Korean', code: 'ko' },
	{ label: 'Latvian', code: 'lv' },
	{ label: 'Lithuanian', code: 'lt' },
	{ label: 'Macedonian', code: 'mk' },
	{ label: 'Malay', code: 'ms' },
	{ label: 'Marathi', code: 'mr' },
	{ label: 'Maori', code: 'mi' },
	{ label: 'Nepali', code: 'ne' },
	{ label: 'Norwegian', code: 'no' },
	{ label: 'Persian', code: 'fa' },
	{ label: 'Polish', code: 'pl' },
	{ label: 'Portuguese', code: 'pt' },
	{ label: 'Romanian', code: 'ro' },
	{ label: 'Russian', code: 'ru' },
	{ label: 'Serbian', code: 'sr' },
	{ label: 'Slovak', code: 'sk' },
	{ label: 'Slovenian', code: 'sl' },
	{ label: 'Spanish', code: 'es' },
	{ label: 'Swahili', code: 'sw' },
	{ label: 'Swedish', code: 'sv' },
	{ label: 'Tagalog', code: 'tl' },
	{ label: 'Tamil', code: 'ta' },
	{ label: 'Thai', code: 'th' },
	{ label: 'Turkish', code: 'tr' },
	{ label: 'Ukrainian', code: 'uk' },
	{ label: 'Urdu', code: 'ur' },
	{ label: 'Vietnamese', code: 'vi' },
	{ label: 'Welsh', code: 'cy' }
] as const;

export const TranscriptionServiceLiveWhisper = Layer.succeed(
	TranscriptionService,
	TranscriptionService.of({
		getSupportedLanguages: Effect.succeed(SUPPORTED_LANGUAGES),
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

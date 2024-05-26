import { Effect, Layer } from 'effect';
import {
	InvalidApiKeyError,
	PleaseEnterApiKeyError,
	TranscriptionError,
	TranscriptionService,
} from '../../services/transcription';

class WhisperFileTooLarge extends TranscriptionError {
	constructor(fileSizeMb: number, maxFileSizeMb: number) {
		super({
			message: `The file size (${fileSizeMb}MB) is too large. Please upload a file smaller than ${maxFileSizeMb}MB.`,
		});
	}
}

class WhisperFetchError extends TranscriptionError {
	constructor({ fetchError }: { fetchError: unknown }) {
		super({
			message: 'Failed to fetch transcription from Whisper API',
			origError: fetchError,
		});
	}
}

class WhisperServerError extends TranscriptionError {
	constructor({ message, code, type }: { message: string; code?: string; type?: string }) {
		super({
			message: `Server error from Whisper API: ${message}\nCode: ${code}\nType: ${type}`,
		});
	}
}

class TranscriptionIsNotStringError extends TranscriptionError {
	constructor() {
		super({
			message: 'Transcription from Whisper API is invalid or not a string',
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
	{ label: 'Afrikaans', value: 'af' },
	{ label: 'Arabic', value: 'ar' },
	{ label: 'Armenian', value: 'hy' },
	{ label: 'Azerbaijani', value: 'az' },
	{ label: 'Belarusian', value: 'be' },
	{ label: 'Bosnian', value: 'bs' },
	{ label: 'Bulgarian', value: 'bg' },
	{ label: 'Catalan', value: 'ca' },
	{ label: 'Chinese', value: 'zh' },
	{ label: 'Croatian', value: 'hr' },
	{ label: 'Czech', value: 'cs' },
	{ label: 'Danish', value: 'da' },
	{ label: 'Dutch', value: 'nl' },
	{ label: 'English', value: 'en' },
	{ label: 'Estonian', value: 'et' },
	{ label: 'Finnish', value: 'fi' },
	{ label: 'French', value: 'fr' },
	{ label: 'Galician', value: 'gl' },
	{ label: 'German', value: 'de' },
	{ label: 'Greek', value: 'el' },
	{ label: 'Hebrew', value: 'he' },
	{ label: 'Hindi', value: 'hi' },
	{ label: 'Hungarian', value: 'hu' },
	{ label: 'Icelandic', value: 'is' },
	{ label: 'Indonesian', value: 'id' },
	{ label: 'Italian', value: 'it' },
	{ label: 'Japanese', value: 'ja' },
	{ label: 'Kannada', value: 'kn' },
	{ label: 'Kazakh', value: 'kk' },
	{ label: 'Korean', value: 'ko' },
	{ label: 'Latvian', value: 'lv' },
	{ label: 'Lithuanian', value: 'lt' },
	{ label: 'Macedonian', value: 'mk' },
	{ label: 'Malay', value: 'ms' },
	{ label: 'Marathi', value: 'mr' },
	{ label: 'Maori', value: 'mi' },
	{ label: 'Nepali', value: 'ne' },
	{ label: 'Norwegian', value: 'no' },
	{ label: 'Persian', value: 'fa' },
	{ label: 'Polish', value: 'pl' },
	{ label: 'Portuguese', value: 'pt' },
	{ label: 'Romanian', value: 'ro' },
	{ label: 'Russian', value: 'ru' },
	{ label: 'Serbian', value: 'sr' },
	{ label: 'Slovak', value: 'sk' },
	{ label: 'Slovenian', value: 'sl' },
	{ label: 'Spanish', value: 'es' },
	{ label: 'Swahili', value: 'sw' },
	{ label: 'Swedish', value: 'sv' },
	{ label: 'Tagalog', value: 'tl' },
	{ label: 'Tamil', value: 'ta' },
	{ label: 'Thai', value: 'th' },
	{ label: 'Turkish', value: 'tr' },
	{ label: 'Ukrainian', value: 'uk' },
	{ label: 'Urdu', value: 'ur' },
	{ label: 'Vietnamese', value: 'vi' },
	{ label: 'Welsh', value: 'cy' },
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
				formData.append('language', outputLanguage);
				const data = yield* _(
					Effect.tryPromise({
						try: () =>
							fetch('https://api.openai.com/v1/audio/transcriptions', {
								method: 'POST',
								headers: { Authorization: `Bearer ${apiKey}` },
								body: formData,
							}).then((res) => res.json()),
						catch: (error) => new WhisperFetchError({ fetchError: error }),
					}),
				);
				if (data?.error?.message) {
					return yield* _(
						new WhisperServerError({
							message: data.error.message,
							code: data.error.code,
							type: data.error.type,
						}),
					);
				}
				if (!isString(data.text)) {
					return yield* _(new TranscriptionIsNotStringError());
				}
				return data.text;
			}),
	}),
);

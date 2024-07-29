import { HttpClient, HttpClientRequest, HttpClientResponse } from '@effect/platform';
import { Schema } from '@effect/schema';
import { WhisperingError } from '@repo/shared';
import { Effect, Layer } from 'effect';
import { TranscriptionService } from './TranscriptionService.js';

function isString(input: unknown): input is string {
	return typeof input === 'string';
}

const MAX_FILE_SIZE_MB = 25 as const;
const FILE_NAME = 'recording.wav';

/** Supported languages pulled from OpenAI Website: https://platform.openai.com/docs/guides/speech-to-text/supported-languages */
export const SUPPORTED_LANGUAGES = [
	'auto',
	'af',
	'ar',
	'hy',
	'az',
	'be',
	'bs',
	'bg',
	'ca',
	'zh',
	'hr',
	'cs',
	'da',
	'nl',
	'en',
	'et',
	'fi',
	'fr',
	'gl',
	'de',
	'el',
	'he',
	'hi',
	'hu',
	'is',
	'id',
	'it',
	'ja',
	'kn',
	'kk',
	'ko',
	'lv',
	'lt',
	'mk',
	'ms',
	'mr',
	'mi',
	'ne',
	'no',
	'fa',
	'pl',
	'pt',
	'ro',
	'ru',
	'sr',
	'sk',
	'sl',
	'es',
	'sw',
	'sv',
	'tl',
	'ta',
	'th',
	'tr',
	'uk',
	'ur',
	'vi',
	'cy',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const SUPPORTED_LANGUAGES_TO_LABEL = {
	auto: 'Auto',
	af: 'Afrikaans',
	ar: 'Arabic',
	hy: 'Armenian',
	az: 'Azerbaijani',
	be: 'Belarusian',
	bs: 'Bosnian',
	bg: 'Bulgarian',
	ca: 'Catalan',
	zh: 'Chinese',
	hr: 'Croatian',
	cs: 'Czech',
	da: 'Danish',
	nl: 'Dutch',
	en: 'English',
	et: 'Estonian',
	fi: 'Finnish',
	fr: 'French',
	gl: 'Galician',
	de: 'German',
	el: 'Greek',
	he: 'Hebrew',
	hi: 'Hindi',
	hu: 'Hungarian',
	is: 'Icelandic',
	id: 'Indonesian',
	it: 'Italian',
	ja: 'Japanese',
	kn: 'Kannada',
	kk: 'Kazakh',
	ko: 'Korean',
	lv: 'Latvian',
	lt: 'Lithuanian',
	mk: 'Macedonian',
	ms: 'Malay',
	mr: 'Marathi',
	mi: 'Maori',
	ne: 'Nepali',
	no: 'Norwegian',
	fa: 'Persian',
	pl: 'Polish',
	pt: 'Portuguese',
	ro: 'Romanian',
	ru: 'Russian',
	sr: 'Serbian',
	sk: 'Slovak',
	sl: 'Slovenian',
	es: 'Spanish',
	sw: 'Swahili',
	sv: 'Swedish',
	tl: 'Tagalog',
	ta: 'Tamil',
	th: 'Thai',
	tr: 'Turkish',
	uk: 'Ukrainian',
	ur: 'Urdu',
	vi: 'Vietnamese',
	cy: 'Welsh',
} as const satisfies Record<SupportedLanguage, string>;

export const TranscriptionServiceWhisperLive = Layer.succeed(
	TranscriptionService,
	TranscriptionService.of({
		supportedLanguages: SUPPORTED_LANGUAGES.map(
			(lang) =>
				({
					label: SUPPORTED_LANGUAGES_TO_LABEL[lang],
					value: lang,
				}) as const,
		),
		transcribe: (audioBlob, { apiKey, outputLanguage }) =>
			Effect.gen(function* () {
				if (!apiKey.startsWith('gsk_')) {
					return yield* new WhisperingError({
						title: 'Invalid Groq API Key',
						description: 'The Groq API Key must start with "gsk_"',
						action: {
							label: 'Update API Key',
							goto: '/settings',
						},
					});
				}
				const blobSizeInMb = audioBlob.size / (1024 * 1024);
				if (blobSizeInMb > MAX_FILE_SIZE_MB) {
					return yield* new WhisperingError({
						title: `The file size (${blobSizeInMb}MB) is too large`,
						description: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
					});
				}
				const wavFile = new File([audioBlob], FILE_NAME);
				const formData = new FormData();
				formData.append('file', wavFile);
				formData.append('model', 'whisper-large-v3');
				if (outputLanguage !== 'auto') formData.append('language', outputLanguage);
				const data = yield* HttpClientRequest.post(
					'https://api.groq.com/openai/v1/audio/transcriptions',
				).pipe(
					HttpClientRequest.setHeaders({
						Authorization: `Bearer ${apiKey}`,
					}),
					HttpClientRequest.formDataBody(formData),
					HttpClient.fetch,
					Effect.andThen(
						HttpClientResponse.schemaBodyJson(
							Schema.Union(
								Schema.Struct({
									text: Schema.String,
								}),
								Schema.Struct({
									error: Schema.Struct({
										message: Schema.String,
									}),
								}),
							),
						),
					),
					Effect.scoped,
					Effect.mapError(
						(error) =>
							new WhisperingError({
								title: 'Error transcribing audio',
								description: error.message,
								error,
							}),
					),
				);
				if ('error' in data) {
					return yield* new WhisperingError({
						title: 'Server error from Groq API',
						description: data.error.message,
						error: data.error,
					});
				}
				return data.text;
			}),
	}),
);

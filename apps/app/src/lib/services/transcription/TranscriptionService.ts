import type { HttpServiceErr } from '$lib/services/http/HttpService';
import { Err, Ok } from '@epicenterhq/result';
import type {
	SupportedLanguage,
	WhisperingErrProperties,
	WhisperingResult,
} from '@repo/shared';
import { SUPPORTED_LANGUAGES, TRANSCRIPTION_SERVICES } from '@repo/shared';

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

export const SUPPORTED_LANGUAGES_OPTIONS = SUPPORTED_LANGUAGES.map(
	(lang) =>
		({ label: SUPPORTED_LANGUAGES_TO_LABEL[lang], value: lang }) as const,
);

export const TRANSCRIPTION_SERVICE_OPTIONS = TRANSCRIPTION_SERVICES.map(
	(service) => ({
		value: service,
		label: service,
	}),
);

export type TranscriptionServiceResult<T> = WhisperingResult<T>;
export type TranscriptionServiceErr = TranscriptionServiceResult<never>;

export type TranscriptionService = {
	transcribe: (audioBlob: Blob) => Promise<TranscriptionServiceResult<string>>;
};

export const TranscriptionServiceErr = (
	args: Pick<WhisperingErrProperties, 'title' | 'description' | 'action'>,
): TranscriptionServiceErr =>
	Err({
		...args,
		variant: 'error',
		_tag: 'WhisperingError',
	});

export function HttpServiceErrIntoTranscriptionServiceErr(
	err: HttpServiceErr,
): TranscriptionServiceErr {
	if (err.ok) return Ok(err.data);
	const { code, error } = err.error;
	switch (code) {
		case 'NetworkError':
			return TranscriptionServiceErr({
				title: '🌐 Network Hiccup!',
				description:
					error instanceof Error
						? `Oops! The internet gremlins are at it again: ${error.message}`
						: 'The internet seems to be playing hide and seek. Please try again later!',
				action: { type: 'more-details', error },
			});

		case 'HttpError':
			return TranscriptionServiceErr({
				title: '🚫 Request Hit a Snag',
				description: `Houston, we have a problem! The server responded with status ${err.error.status}. Let's try that again, shall we?`,
				action: { type: 'more-details', error },
			});

		case 'ParseError':
			return TranscriptionServiceErr({
				title: '🤔 Data Puzzle',
				description:
					error instanceof Error
						? `Looks like we got some unexpected data: ${error.message}`
						: 'The data we received is not quite what we expected. Mind trying again?',
				action: { type: 'more-details', error },
			});
	}
}

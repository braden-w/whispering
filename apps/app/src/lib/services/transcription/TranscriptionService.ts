import { Err, type Ok } from '@epicenterhq/result';
import type {
	Settings,
	WhisperingErr,
	WhisperingErrProperties,
} from '@repo/shared';
import type { HttpServiceErr } from '../http/HttpService';

export type TranscriptionServiceErr = WhisperingErr;
export type TranscriptionServiceResult<T> = Ok<T> | WhisperingErr;

export type TranscriptionService = {
	transcribe: (
		audioBlob: Blob,
		options: {
			prompt: string;
			temperature: string;
			outputLanguage: Settings['transcription.outputLanguage'];
		},
	) => Promise<TranscriptionServiceResult<string>>;
};

export const TranscriptionServiceErr = (
	args: Pick<WhisperingErrProperties, 'title' | 'description' | 'action'>,
): TranscriptionServiceErr =>
	Err({
		...args,
		variant: 'error',
		_tag: 'WhisperingError',
	});

export function HttpServiceErrIntoTranscriptionServiceErr({
	error,
}: HttpServiceErr): TranscriptionServiceErr {
	switch (error.code) {
		case 'NetworkError':
			return TranscriptionServiceErr({
				title: '🌐 Network Connection Failed',
				description:
					error.error instanceof Error
						? `Unable to reach the transcription service: ${error.error.message}. Please check your internet connection and try again.`
						: 'Unable to establish a connection to our transcription service. This could be due to a firewall, VPN, or network connectivity issue.',
				action: { type: 'more-details', error: error.error },
			});

		case 'HttpError': {
			const status = error.status;

			if (status === 401) {
				return TranscriptionServiceErr({
					title: '🔑 Authentication Failed',
					description:
						'Your current API key is invalid or has expired. Head to settings to enter a valid key and continue transcribing!',
					// action: { type: 'more-details', error: error.error },
					action: {
						type: 'link',
						label: 'Go to settings',
						goto: '/settings/transcription',
					},
				});
			}

			if (status === 403) {
				return TranscriptionServiceErr({
					title: '⛔ Access Denied',
					description:
						"You don't have permission to use this service. This could be due to account restrictions or exceeded usage limits.",
					action: { type: 'more-details', error: error.error },
				});
			}

			if (status === 413) {
				return TranscriptionServiceErr({
					title: '📦 Audio File Too Large',
					description:
						'The audio file exceeds the maximum size limit. Try splitting it into smaller segments or reducing the audio quality.',
					action: { type: 'more-details', error: error.error },
				});
			}

			if (status === 415) {
				return TranscriptionServiceErr({
					title: '🎵 Unsupported Audio Format',
					description:
						'The audio file format is not supported. Please use MP3, WAV, or other common audio formats.',
					action: { type: 'more-details', error: error.error },
				});
			}

			// Rate limiting
			if (status === 429) {
				return TranscriptionServiceErr({
					title: '⏳ Rate Limit Exceeded',
					description:
						"You've made too many requests. Please wait a moment before trying again or upgrade your plan for higher limits.",
					action: { type: 'more-details', error: error.error },
				});
			}

			if (status >= 500) {
				return TranscriptionServiceErr({
					title: '🔧 Server Error',
					description: `The transcription service is experiencing technical difficulties (Error ${status}).`,
					action: { type: 'more-details', error: error.error },
				});
			}

			return TranscriptionServiceErr({
				title: '❌ Request Failed',
				description: `The transcription request failed with status ${status}. This might be temporary - please try again.`,
				action: { type: 'more-details', error: error.error },
			});
		}

		case 'ParseError':
			return TranscriptionServiceErr({
				title: '🔍 Invalid Response',
				description:
					error.error instanceof Error
						? `The transcription service returned an unexpected response format: ${error.error.message}. This might indicate an API version mismatch.`
						: "The transcription service response couldn't be processed. This might be due to a service upgrade or temporary issue.",
				action: { type: 'more-details', error: error.error },
			});

		default:
			return TranscriptionServiceErr({
				title: '❓ Unexpected Error',
				description:
					'An unexpected error occurred during transcription. Please try again or contact support if the issue persists.',
				action: { type: 'more-details' },
			});
	}
}

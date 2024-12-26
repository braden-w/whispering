import type { HttpServiceErr } from '$lib/services/http/HttpService';
import { Err, type Ok } from '@epicenterhq/result';
import type { WhisperingErr, WhisperingErrProperties } from '@repo/shared';

export type TranscriptionServiceErr = WhisperingErr;
export type TranscriptionServiceResult<T> = Ok<T> | WhisperingErr;

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

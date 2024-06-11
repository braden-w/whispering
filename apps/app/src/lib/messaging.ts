import { Effect } from 'effect';
import { ClipboardError } from './services/ClipboardService';
import type { RecorderState, Result } from '@repo/shared';

const WHISPERING_EXTENSION_ID = 'kiiocjnndmjallnnojknfblenodpbkha';

export const sendRecorderStateToExtension = (recorderState: RecorderState) =>
	chrome.runtime.sendMessage(WHISPERING_EXTENSION_ID, {
		message: 'setRecorderState',
		recorderState,
	});

export const copyTranscriptionFromExtension = (transcription: string) =>
	Effect.async<string, ClipboardError>((resume) =>
		chrome.runtime.sendMessage(
			WHISPERING_EXTENSION_ID,
			{
				message: 'transcription',
				transcription,
			},
			function (response: Result<string, unknown>) {
				if (!response.isSuccess) {
					return resume(
						Effect.fail(
							new ClipboardError({
								title: 'Error copying transcription from recording',
							}),
						),
					);
				}
				return resume(Effect.succeed(response.data));
			},
		),
	);

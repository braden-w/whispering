import type {
	ExternalMessage,
	Result,
	WhisperingErrorProperties
} from '@repo/shared';
import { Effect } from 'effect';

const WHISPERING_EXTENSION_ID = 'kiiocjnndmjallnnojknfblenodpbkha';

export const sendMessageToExtension = <M extends ExternalMessage, R>(message: M) =>
	Effect.async<R, WhisperingErrorProperties>((resume) => {
		chrome.runtime.sendMessage<ExternalMessage>(
			WHISPERING_EXTENSION_ID,
			message,
			function (response: Result<R>) {
				if (!response.isSuccess) {
					return resume(Effect.fail(response.error));
				}
				return resume(Effect.succeed(response.data));
			},
		);
	});

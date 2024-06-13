import type { ExternalMessage, Result, WhisperingErrorProperties } from '@repo/shared';
import { WHISPERING_EXTENSION_ID } from '@repo/shared';
import { Effect } from 'effect';

export const sendMessageToExtension = <
	M extends ExternalMessage,
	T extends unknown,
	R extends Result<T>,
>(
	message: M,
) =>
	Effect.async<T, WhisperingErrorProperties>((resume) => {
		chrome.runtime.sendMessage<ExternalMessage>(
			WHISPERING_EXTENSION_ID,
			message,
			function (response: R) {
				if (!response.isSuccess) {
					return resume(Effect.fail(response.error));
				}
				return resume(Effect.succeed(response.data));
			},
		);
	});

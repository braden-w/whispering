import type { ExternalMessage, Result, WhisperingErrorProperties } from '@repo/shared';
import { WHISPERING_EXTENSION_ID } from '@repo/shared';
import { Effect, Cause } from 'effect';

export const sendMessageToExtension = <
	T extends unknown,
	E extends Cause.YieldableError & Readonly<WhisperingErrorProperties>,
	M extends ExternalMessage = ExternalMessage,
	R extends Result<T, E> = Result<T, E>,
>(
	message: M,
) =>
	Effect.async<T, E>((resume) => {
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

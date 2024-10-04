import { sendToBackgroundViaRelay } from '@plasmohq/messaging';
import type {
	ExternalMessage,
	ExternalMessageReturnType,
	Result,
} from '@repo/shared';
import { WhisperingError, resultToEffect } from '@repo/shared';
import { Effect } from 'effect';

export const sendMessageToExtension = <
	M extends ExternalMessage,
	ExternalMessageName extends ExternalMessage['name'] = M['name'],
	T = ExternalMessageReturnType<ExternalMessageName>,
>(
	message: M,
) =>
	Effect.gen(function* () {
		if (window.__TAURI_INTERNALS__) return;
		const response = yield* Effect.tryPromise({
			try: () =>
				sendToBackgroundViaRelay({
					name: message.name as never,
					body: message.body,
				}) as Promise<Result<T>>,
			catch: (error) =>
				new WhisperingError({
					title: 'Unable to send message to extension',
					description:
						'There was likely an issue sending the message to the extension.',
					error,
				}),
		}).pipe(Effect.flatMap(resultToEffect));
		return response;
	});

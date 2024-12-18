import { sendToBackgroundViaRelay } from '@plasmohq/messaging';
import type {
	ExternalMessage,
	ExternalMessageReturnType,
	Result,
} from '@repo/shared';
import { Ok, tryAsync } from '@repo/shared';

export const sendMessageToExtension = async <
	M extends ExternalMessage,
	ExternalMessageName extends ExternalMessage['name'] = M['name'],
	T = ExternalMessageReturnType<ExternalMessageName>,
>(
	message: M,
) => {
	if (window.__TAURI_INTERNALS__) return Ok(undefined);
	const responseResult = await tryAsync({
		try: () =>
			sendToBackgroundViaRelay({
				name: message.name as never,
				body: message.body,
			}) as Promise<Result<T>>,
		catch: (error) => ({
			_tag: 'WhisperingError',
			title: 'Unable to send message to extension',
			description:
				'There was likely an issue sending the message to the extension.',
			action: {
				type: 'more-details',
				error,
			},
		}),
	});

	return responseResult;
};

import { sendToBackgroundViaRelay } from '@plasmohq/messaging';
import type {
	ExternalMessage,
	ExternalMessageReturnType,
	WhisperingResult,
} from '@repo/shared';
import { Ok, tryAsyncWhispering } from '@repo/shared';

export async function sendMessageToExtension<M extends ExternalMessage>(
	message: M,
): Promise<WhisperingResult<undefined | ExternalMessageReturnType<M['name']>>> {
	if (window.__TAURI_INTERNALS__) return Ok(undefined);
	const sendToBackgroundResult = await tryAsyncWhispering({
		try: () =>
			sendToBackgroundViaRelay({
				name: message.name as never,
				body: message.body,
			}) as Promise<WhisperingResult<ExternalMessageReturnType<M['name']>>>,
		catch: (error) =>
			({
				_tag: 'WhisperingError',
				title: 'Unable to send message to extension',
				description: `There was an issue sending the message ${message.name} to the extension via background relay.`,
				action: { type: 'more-details', error },
			}) as const,
	});

	if (!sendToBackgroundResult.ok) return sendToBackgroundResult;
	const response = sendToBackgroundResult.data;
	if (!response) return response;
	return response;
}

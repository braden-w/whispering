import {
	Err,
	Ok,
	tryAsync,
	type InferErr,
	type Result,
} from '@epicenterhq/result';
import { sendToBackgroundViaRelay } from '@plasmohq/messaging';
import type { ExternalMessage, ExternalMessageReturnType } from '@repo/shared';

type SendMessageToExtensionResult<M extends ExternalMessage> = Result<
	undefined | ExternalMessageReturnType<M['name']>,
	{ _tag: 'SendMessageToExtensionError'; message: M; error: unknown }
>;

type SendMessageToExtensionErr<M extends ExternalMessage> = InferErr<
	SendMessageToExtensionResult<M>
>;

export async function sendMessageToExtension<M extends ExternalMessage>(
	message: M,
): Promise<SendMessageToExtensionResult<M>> {
	if (window.__TAURI_INTERNALS__) return Ok(undefined);
	const sendToBackgroundResult = await tryAsync({
		try: () =>
			sendToBackgroundViaRelay({
				name: message.name as never,
				body: message.body,
			}) as Promise<ExternalMessageReturnType<M['name']>>,
		mapErr: (error) =>
			Err({ _tag: 'SendMessageToExtensionError', message, error } as const),
	});

	if (!sendToBackgroundResult.ok) return sendToBackgroundResult;
	const response = sendToBackgroundResult.data;
	return Ok(response);
}

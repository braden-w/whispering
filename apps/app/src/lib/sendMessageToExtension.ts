import { Err, Ok, tryAsync } from '@epicenterhq/result';
import { sendToBackgroundViaRelay } from '@plasmohq/messaging';
import type { ExternalMessage, ExternalMessageReturnType } from '@repo/shared';

export type SendMessageToExtensionErrProperties<M extends ExternalMessage> = {
	_tag: 'SendMessageToExtensionError';
	message: M;
	error: unknown;
};

export type SendMessageToExtensionErr<M extends ExternalMessage> = Err<
	SendMessageToExtensionErrProperties<M>
>;

export type SendMessageToExtensionResult<M extends ExternalMessage> =
	| Ok<ExternalMessageReturnType<M['name']>>
	| SendMessageToExtensionErr<M>;

export const SendMessageToExtensionErr = <M extends ExternalMessage>(
	args: Omit<SendMessageToExtensionErrProperties<M>, '_tag'>,
): SendMessageToExtensionErr<M> =>
	Err({
		_tag: 'SendMessageToExtensionError',
		...args,
	} as const);

export async function sendMessageToExtension<M extends ExternalMessage>(
	message: M,
): Promise<
	SendMessageToExtensionResult<M> | ExternalMessageReturnType<M['name']>
> {
	const sendToBackgroundResult = await tryAsync({
		try: () =>
			sendToBackgroundViaRelay({
				name: message.name as never,
				body: message.body,
			}) as Promise<ExternalMessageReturnType<M['name']>>,
		mapErr: (error) => SendMessageToExtensionErr({ message, error }),
	});

	if (!sendToBackgroundResult.ok) return sendToBackgroundResult;
	const response = sendToBackgroundResult.data;
	if (!response.ok) return response;
	return Ok(response);
}

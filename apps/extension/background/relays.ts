import { Err, type Ok, tryAsync } from '@epicenterhq/result';
import { sendToBackgroundViaRelay } from '@plasmohq/messaging';

type SendMessageToExtensionErrProperties = {
	_tag: 'SendMessageToExtensionError';
	input: Parameters<typeof sendToBackgroundViaRelay>[0];
	error: unknown;
};

export type SendMessageToExtensionErr =
	Err<SendMessageToExtensionErrProperties>;

export type SendMessageToExtensionResult<T> = Ok<T> | SendMessageToExtensionErr;

export const SendMessageToExtensionErr = (
	args: Omit<SendMessageToExtensionErrProperties, '_tag'>,
): SendMessageToExtensionErr =>
	Err({
		_tag: 'SendMessageToExtensionError',
		...args,
	} as const);

export const sendToBackgroundResult = async (
	...args: Parameters<typeof sendToBackgroundViaRelay>
) => {
	const result = await tryAsync({
		try: () => sendToBackgroundViaRelay(...args),
		mapErr: (error) => SendMessageToExtensionErr({ input: args[0], error }),
	});

	if (!result.ok) return result;
	return result.data;
};

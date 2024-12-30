import { Err, type Ok, tryAsync } from '@epicenterhq/result';
import { sendToBackgroundViaRelay } from '@plasmohq/messaging';
import { WhisperingErr, type WhisperingResult } from '@repo/shared';
import type {
	ClearNotificationMessage,
	ClearNotificationResult,
} from '../background/messages/extension/clearNotification';
import type {
	CreateNotificationMessage,
	CreateNotificationResult,
} from '../background/messages/extension/createNotification';
import type {
	NotifyWhisperingTabReadyMessage,
	NotifyWhisperingTabReadyResult,
} from '../background/messages/extension/notifyWhisperingTabReady';
import type {
	PlaySoundMessage,
	PlaySoundResult,
} from '../background/messages/extension/playSound';
import type {
	SetClipboardTextMessage,
	SetClipboardTextResult,
} from '../background/messages/extension/setClipboardText';
import type {
	SetRecorderStateMessage,
	SetRecorderStateResult,
} from '../background/messages/extension/setRecorderState';
import type {
	WriteTextToCursorMessage,
	WriteTextToCursorResult,
} from '../background/messages/extension/writeTextToCursor';
import type {
	OpenWhisperingTabMessage,
	OpenWhisperingTabResult,
} from '~background/messages/extension/openWhisperingTab';

type SendMessageToExtensionErrProperties = {
	_tag: 'SendMessageToExtensionError';
	name: string;
	body: unknown;
	metadata: Parameters<typeof sendToBackgroundViaRelay>[0];
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

const TIMEOUT_SECONDS = 1;

export const sendMessageToExtension = async <
	R extends WhisperingResult<unknown>,
>(
	...args: Parameters<typeof sendToBackgroundViaRelay>
): Promise<R | WhisperingErr> => {
	const sendResult = (await tryAsync({
		try: async () => {
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => {
					reject(
						new Error(
							`Extension messaging timeout after ${TIMEOUT_SECONDS} seconds`,
						),
					);
				}, TIMEOUT_SECONDS * 1000);
			});

			const messagePromise = sendToBackgroundViaRelay(...args);
			await Promise.race([messagePromise, timeoutPromise]);
			return await messagePromise;
		},
		mapErr: (error) => {
			const { name, body } = args[0];
			return SendMessageToExtensionErr({
				name,
				body,
				metadata: args[0],
				error,
			});
		},
	})) as SendMessageToExtensionResult<R>;

	if (!sendResult.ok) {
		const { name, body, metadata, error } = sendResult.error;
		return WhisperingErr({
			title: `Unable to ${name} - Extension Connection Failed`,
			description: `Unable to send "${name}" command to the browser extension's background service worker. This could be due to the extension not being properly initialized or a communication error.`,
			action: {
				type: 'more-details',
				error: { name, body, metadata, error },
			},
		});
	}
	const commandAsWhisperingResult = sendResult.data;
	return commandAsWhisperingResult;
};

export const extension = (() => {
	return {
		createNotification: async (body: CreateNotificationMessage) => {
			const result = await sendMessageToExtension<CreateNotificationResult>({
				name: 'extension/createNotification',
				body,
			});
			return result;
		},
		clearNotification: async (body: ClearNotificationMessage) => {
			const result = await sendMessageToExtension<ClearNotificationResult>({
				name: 'extension/clearNotification',
				body,
			});
			return result;
		},
		notifyWhisperingTabReady: async (body: NotifyWhisperingTabReadyMessage) => {
			const result =
				await sendMessageToExtension<NotifyWhisperingTabReadyResult>({
					name: 'extension/notifyWhisperingTabReady',
					body,
				});
			return result;
		},
		openWhisperingTab: async (body: OpenWhisperingTabMessage) => {
			const result = await sendMessageToExtension<OpenWhisperingTabResult>({
				name: 'extension/openWhisperingTab',
				body,
			});
			return result;
		},
		playSound: async (body: PlaySoundMessage) => {
			const result = await sendMessageToExtension<PlaySoundResult>({
				name: 'extension/playSound',
				body,
			});
			return result;
		},
		setClipboardText: async (body: SetClipboardTextMessage) => {
			const result = await sendMessageToExtension<SetClipboardTextResult>({
				name: 'extension/setClipboardText',
				body,
			});
			return result;
		},
		setRecorderState: async (body: SetRecorderStateMessage) => {
			const result = await sendMessageToExtension<SetRecorderStateResult>({
				name: 'extension/setRecorderState',
				body,
			});
			return result;
		},
		writeTextToCursor: async (body: WriteTextToCursorMessage) => {
			const result = await sendMessageToExtension<WriteTextToCursorResult>({
				name: 'extension/writeTextToCursor',
				body,
			});
			return result;
		},
	};
})();

import { Err, Ok, tryAsync } from '@epicenterhq/result';
import { sendToBackgroundViaRelay } from '@plasmohq/messaging';
import type {
  ClearNotificationMessage,
  ClearNotificationResult,
} from './clearNotification';
import type {
  CreateNotificationMessage,
  CreateNotificationResult,
} from './createNotification';
import type {
  NotifyWhisperingTabReadyMessage,
  NotifyWhisperingTabReadyResult,
} from './notifyWhisperingTabReady';
import type { PlaySoundMessage, PlaySoundResult } from './playSound';
import type {
  SetClipboardTextMessage,
  SetClipboardTextResult,
} from './setClipboardText';
import type {
  SetRecorderStateMessage,
  SetRecorderStateResult,
} from './setRecorderState';
import type {
  WriteTextToCursorMessage,
  WriteTextToCursorResult,
} from './writeTextToCursor';

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

export const sendMessageToExtension = async (
	...args: Parameters<typeof sendToBackgroundViaRelay>
) => {
	const result = await tryAsync({
		try: () => sendToBackgroundViaRelay(...args),
		mapErr: (error) => SendMessageToExtensionErr({ input: args[0], error }),
	});

	if (!result.ok) return result;
	return Ok(result.data);
};

export const extension = {
	createNotification: async (body: CreateNotificationMessage) => {
		const result = (await sendMessageToExtension({
			name: 'whispering-extension/createNotification',
			body,
		})) as SendMessageToExtensionResult<CreateNotificationResult>;
		return result;
	},
	clearNotification: async (body: ClearNotificationMessage) => {
		const result = (await sendMessageToExtension({
			name: 'whispering-extension/clearNotification',
			body,
		})) as SendMessageToExtensionResult<ClearNotificationResult>;
		return result;
	},
	notifyWhisperingTabReady: async (body: NotifyWhisperingTabReadyMessage) => {
		const result = await sendMessageToExtension({
			name: 'whispering-extension/notifyWhisperingTabReady',
			body,
		});
		return result as SendMessageToExtensionResult<NotifyWhisperingTabReadyResult>;
	},
	playSound: async (body: PlaySoundMessage) => {
		const result = (await sendMessageToExtension({
			name: 'whispering-extension/playSound',
			body,
		})) as SendMessageToExtensionResult<PlaySoundResult>;
		return result;
	},
	setClipboardText: async (body: SetClipboardTextMessage) => {
		const result = (await sendMessageToExtension({
			name: 'whispering-extension/setClipboardText',
			body,
		})) as SendMessageToExtensionResult<SetClipboardTextResult>;
		return result;
	},
	setRecordingState: async (body: SetRecorderStateMessage) => {
		const result = (await sendMessageToExtension({
			name: 'whispering-extension/setRecorderState',
			body,
		})) as SendMessageToExtensionResult<SetRecorderStateResult>;
		return result;
	},
	writeTextToCursor: async (body: WriteTextToCursorMessage) => {
		const result = (await sendMessageToExtension({
			name: 'whispering-extension/writeTextToCursor',
			body,
		})) as SendMessageToExtensionResult<WriteTextToCursorResult>;
		return result;
	},
};

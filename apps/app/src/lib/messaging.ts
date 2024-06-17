import type {
	ExternalMessage,
	RecorderState,
	Result,
	ToastOptions,
	WhisperingErrorProperties,
} from '@repo/shared';
import { WHISPERING_EXTENSION_ID, WhisperingError } from '@repo/shared';
import { Effect } from 'effect';

const sendMessageToExtension = <T extends unknown>(message: ExternalMessage) =>
	Effect.async<T, WhisperingError>((resume) => {
		chrome.runtime.sendMessage<ExternalMessage>(
			WHISPERING_EXTENSION_ID,
			message,
			function (response: Result<T, WhisperingErrorProperties>) {
				if (!response.isSuccess) {
					const whisperingError = new WhisperingError(response.error);
					return resume(Effect.fail(whisperingError));
				}
				return resume(Effect.succeed(response.data));
			},
		);
	});

export const invokeExtensionCommand = {
	setRecorderState: (recorderState: RecorderState) =>
		sendMessageToExtension<void>({
			message: 'setRecorderState',
			recorderState,
		}),
	playSound: (sound: 'start' | 'stop' | 'cancel') =>
		sendMessageToExtension<void>({
			message: 'playSound',
			sound,
		}),
	setClipboardText: (text: string) =>
		sendMessageToExtension<void>({
			message: 'setClipboardText',
			transcribedText: text,
		}),
	writeTextToCursor: (text: string) =>
		sendMessageToExtension<void>({
			message: 'writeTextToCursor',
			transcribedText: text,
		}),
	toast: (toastOptions: ToastOptions) =>
		sendMessageToExtension<string | number>({
			message: 'toast',
			toastOptions,
		}),
} as const satisfies Record<
	ExternalMessage['message'],
	(...args: any[]) => Effect.Effect<any, WhisperingError>
>;

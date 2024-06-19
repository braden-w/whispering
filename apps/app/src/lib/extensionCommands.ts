import type { ExternalMessage, RecorderState, Result, ToastOptions } from '@repo/shared';
import { WHISPERING_EXTENSION_ID, WhisperingError } from '@repo/shared';
import { Effect } from 'effect';

const sendMessageToExtension = <T extends unknown>(message: ExternalMessage) =>
	Effect.async<T, WhisperingError>((resume) => {
		if (window.__TAURI__ || !chrome) return;
		try {
			chrome.runtime.sendMessage<ExternalMessage>(
				WHISPERING_EXTENSION_ID,
				message,
				function (response: Result<T>) {
					if (!response.isSuccess) {
						const whisperingError = new WhisperingError(response.error);
						return resume(Effect.fail(whisperingError));
					}
					return resume(Effect.succeed(response.data));
				},
			);
		} catch (error) {
			return resume(
				Effect.fail(
					new WhisperingError({
						title: 'Unable to send message to extension',
						description: 'An error occurred while trying to send a message to the extension.',
						error,
					}),
				),
			);
		}
	});

export const extensionCommands = {
	setRecorderState: (recorderState: RecorderState) =>
		sendMessageToExtension<void>({
			name: 'setRecorderState',
			body: { recorderState },
		}),
	playSound: (sound: 'start' | 'stop' | 'cancel') =>
		sendMessageToExtension<void>({
			name: 'playSound',
			body: { sound },
		}),
	setClipboardText: (text: string) =>
		sendMessageToExtension<void>({
			name: 'setClipboardText',
			body: { transcribedText: text },
		}),
	writeTextToCursor: (text: string) =>
		sendMessageToExtension<void>({
			name: 'writeTextToCursor',
			body: { transcribedText: text },
		}),
	toast: (toastOptions: ToastOptions) =>
		sendMessageToExtension<string | number>({
			name: 'toast',
			body: { toastOptions },
		}),
} as const satisfies Record<
	ExternalMessage['name'],
	(...args: any[]) => Effect.Effect<any, WhisperingError>
>;

import { sendToBackgroundViaRelay } from '@plasmohq/messaging';
import type { ExternalMessage, RecorderState, Result, ToastOptions } from '@repo/shared';
import { WhisperingError, resultToEffect } from '@repo/shared';
import { Effect } from 'effect';

const sendMessageToExtension = <T>(message: ExternalMessage) =>
	Effect.gen(function* () {
		if (window.__TAURI__ || !chrome) return;
		const response = yield* Effect.tryPromise({
			try: () =>
				sendToBackgroundViaRelay({ name: message.name, body: message.body }) as Promise<Result<T>>,
			catch: (error) =>
				new WhisperingError({
					title: 'Unable to send message to extension',
					description: 'There was likely an issue sending the message to the extension.',
					error,
				}),
		}).pipe(Effect.flatMap(resultToEffect));
		return response;
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

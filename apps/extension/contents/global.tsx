import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { RecorderService } from '@/lib/services/RecorderService';
import { RecorderServiceLive } from '@/lib/services/RecorderServiceLive';
import { RecorderStateService } from '@/lib/services/RecorderState';
import { RecorderStateLive } from '@/lib/services/RecorderStateLive';
import { Console } from 'effect';
import cssText from 'data-text:~/style.css';
import { Effect } from 'effect';
import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo';
import { useEffect } from 'react';
import { z } from 'zod';
import { ExtensionStorageService } from '~lib/services/ExtensionStorage';
import { ExtensionStorageLive } from '~lib/services/ExtensionStorageLive';
import { commands, type MessageToContext } from '~lib/utils/commands';

export const config: PlasmoCSConfig = {
	matches: ['<all_urls>'],
	// exclude_matches: CHATGPT_DOMAINS,
};

export const getStyle: PlasmoGetStyle = () => {
	const style = document.createElement('style');
	style.textContent = cssText;
	return style;
};

const syncRecorderStateWithMediaRecorderStateOnLoad = Effect.gen(function* () {
	const recorderService = yield* RecorderService;
	const recorderStateService = yield* RecorderStateService;
	const initialRecorderState = yield* recorderService.recorderState;
	yield* recorderStateService.set(initialRecorderState);
	yield* Console.info('Synced recorder state with media recorder state on load', {
		initialRecorderState,
	});
}).pipe(Effect.provide(RecorderStateLive), Effect.provide(RecorderServiceLive), Effect.runPromise);

const _registerListeners = chrome.runtime.onMessage.addListener(
	(message: MessageToContext<'GlobalContentScript'>, sender, sendResponse) => {
		const program = Effect.gen(function* () {
			const { commandName, args } = message;
			yield* Console.info('Received message in global content script', { commandName, args });
			const correspondingCommand = commands[commandName];
			const response = yield* correspondingCommand.runInGlobalContentScript(...args);
			yield* Console.info(`Responding to invoked command ${commandName} in global content script`, {
				response,
			});
			sendResponse(response);
		});
		program.pipe(Effect.runPromise);
		return true; // Will respond asynchronously.
	},
);

function ErrorToast() {
	const { toast } = useToast();
	useEffect(
		() =>
			Effect.gen(function* () {
				const extensionStorage = yield* ExtensionStorageService;
				yield* extensionStorage.watch({
					key: 'whispering-toast',
					schema: z.object({
						title: z.string(),
						description: z.string().optional(),
					}),
					callback: (newValue) =>
						toast({
							...newValue,
							variant: 'destructive',
						}),
				});
			}).pipe(Effect.provide(ExtensionStorageLive), Effect.runSync),
		[],
	);
	return <Toaster />;
}

export default ErrorToast;

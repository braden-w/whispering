import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { RecorderService } from '@/lib/services/RecorderService';
import { RecorderServiceLive } from '@/lib/services/RecorderServiceLive';
import { RecorderStateService } from '@/lib/services/RecorderState';
import { RecorderStateLive } from '@/lib/services/RecorderStateLive';
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
}).pipe(Effect.provide(RecorderStateLive), Effect.provide(RecorderServiceLive), Effect.runPromise);

const registerListeners = chrome.runtime.onMessage.addListener(
	(message: MessageToContext<'GlobalContentScript'>, sender, sendResponse) =>
		Effect.gen(function* () {
			const { commandName, args } = message;
			const correspondingCommand = commands[commandName];
			sendResponse(yield* correspondingCommand.runInGlobalContentScript(...args));
			return true; // Will respond asynchronously.
		}).pipe(Effect.runPromise),
);

function PlasmoContent() {
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

export default PlasmoContent;

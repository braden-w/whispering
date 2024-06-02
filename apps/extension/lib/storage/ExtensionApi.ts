type Icon = 'studioMicrophone' | 'redLargeSquare' | 'arrowsCounterclockwise';
import type { Effect } from 'effect';
import { Context, Data } from 'effect';
import type { MessageToContentScriptRequest } from '~lib/utils/messaging';

export class ExtensionApiError extends Data.TaggedError('ExtensionApiError')<{
	message: string;
	origError?: unknown;
}> {}

export class ExtensionApiService extends Context.Tag('ExtensionApiService')<
	ExtensionApiService,
	{
		readonly getCurrentTabId: () => Effect.Effect<number | undefined, ExtensionApiError>;
		readonly sendMessageToContentScript: <R>(
			tabId: number,
			message: MessageToContentScriptRequest,
		) => Effect.Effect<R>;
		openOptionsPage: () => Effect.Effect<void, ExtensionApiError>;
		setIcon: (icon: Icon) => Effect.Effect<void, ExtensionApiError>;

		// readonly sendMessageToPopup: (message: any) => Effect.Effect<void, ExtensionApiError>;
		// readonly sendMessageToBackground: (message: any) => Effect.Effect<void, ExtensionApiError>;
		// readonly sendMessageToContentScript: (
		// 	tabId: number,
		// 	message: any,
		// 	options?: chrome.tabs.MessageSendOptions,
		// ) => Effect.Effect<void, ExtensionApiError>;
	}
>() {}

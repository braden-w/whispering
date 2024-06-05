import { Option } from 'effect';
import { RecorderError, RecorderService } from '@/lib/services/RecorderService';
import { RecorderServiceLive } from '@/lib/services/RecorderServiceLive';
import { RecorderStateService } from '@/lib/services/RecorderState';
import { RecorderStateLive } from '@/lib/services/RecorderStateLive';
import { Data, Effect } from 'effect';
import { z } from 'zod';

import stopSoundSrc from 'data-base64:~assets/sound_ex_machina_Button_Blip.mp3';
import startSoundSrc from 'data-base64:~assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import cancelSoundSrc from 'data-base64:~assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';
import { ExtensionStorageError, ExtensionStorageService } from '~lib/services/ExtensionStorage';
import { ExtensionStorageLive } from '~lib/services/ExtensionStorageLive';

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

/**
 * One popup, one background service worker, and one or many content scripts.
 *
 * Represents the possible contexts where a command can run.
 */
type ExecutionContext =
	| 'Popup'
	| 'BackgroundServiceWorker'
	| 'GlobalContentScript'
	| 'WhisperingContentScript';

type AnyFunction = (...args: any[]) => any;

/**
 * Represents the configuration for a command.
 *
 * This configuration includes:
 * - `runIn[NativeContext]`: Function to directly execute the command in its
 *   native context.
 * - `invokeFrom[OtherContexts]`?: Optional functions to invoke the command from
 *   other contexts.
 *
 * For example:
 * - A command `toggleRecrding` that runs in the context "GlobalContentScript"
 *   can be directly executed from the gobal content script by calling
 *   `runInGlobalContentScript`.
 * - The same command can be invoked from the background service worker by calling
 *   `invokeFromBackgroundServiceWorker`.
 * - The same command can be invoked from the context "Popup" by calling
 *   `invokeFromPopup`.
 *
 * @template NativeContext - The native context where the command runs.
 * @template CommandFn - The function definition of the command.
 */
type Command<NativeContext extends ExecutionContext, CommandFn extends AnyFunction> = {
	runsIn: NativeContext;
} & {
	[K in ExecutionContext as K extends NativeContext ? `runIn${K}` : never]: CommandFn;
} & {
	[C in ExecutionContext as C extends NativeContext ? never : `invokeFrom${C}`]?: CommandFn;
};

/**
 * Error thrown when an invocation of a command fails.
 */
class InvokeCommandError extends Data.TaggedError('InvokeCommandError')<{
	message: string;
	origError?: unknown;
}> {}

const sendMessageToContentScript = <R>(tabId: number, message: any) =>
	Effect.promise(() => chrome.tabs.sendMessage<any, R>(tabId, message));

type MessageToContext<ContextName extends ExecutionContext> = {
	[K in keyof Commands as Commands[K]['runsIn'] extends ContextName ? K : never]: {
		commandName: K;
		args: Commands[K];
	};
};
const sendMessageToBackground = <R>(message: any) =>
	Effect.promise(() => chrome.runtime.sendMessage<any, R>(message));

// --- Define commands ---

type Commands = {
	openOptionsPage: Command<
		'BackgroundServiceWorker',
		() => Effect.Effect<void, InvokeCommandError, never>
	>;
	getCurrentTabId: Command<
		'BackgroundServiceWorker',
		() => Effect.Effect<void, InvokeCommandError, never>
	>;
	getSettings: Command<
		'WhisperingContentScript',
		() => Effect.Effect<Settings, InvokeCommandError, never>
	>;
	setSettings: Command<
		'WhisperingContentScript',
		(settings: Settings) => Effect.Effect<void, InvokeCommandError, never>
	>;
	toggleRecording: Command<
		'GlobalContentScript',
		() => Effect.Effect<void, InvokeCommandError | ExtensionStorageError | RecorderError, never>
	>;
	cancelRecording: Command<
		'GlobalContentScript',
		() => Effect.Effect<void, InvokeCommandError | ExtensionStorageError | RecorderError, never>
	>;
	sendErrorToast: Command<
		'GlobalContentScript',
		(toast: {
			title: string;
			description?: string;
		}) => Effect.Effect<void, InvokeCommandError | ExtensionStorageError, never>
	>;
};

const openOptionsPage = {
	runsIn: 'BackgroundServiceWorker',
	runInBackgroundServiceWorker: () =>
		Effect.tryPromise({
			try: () => chrome.runtime.openOptionsPage(),
			catch: (e) => new InvokeCommandError({ message: 'Error opening options page', origError: e }),
		}),
	invokeFromGlobalContentScript: () =>
		Effect.gen(function* () {
			const response = yield* sendMessageToBackground<void>({ commandName: 'openOptionsPage' });
			return response;
		}),
} as const satisfies Commands['openOptionsPage'];

const getCurrentTabId = {
	runsIn: 'BackgroundServiceWorker',
	runInBackgroundServiceWorker: () =>
		Effect.gen(function* () {
			const activeTabs = yield* Effect.tryPromise({
				try: () => chrome.tabs.query({ active: true, currentWindow: true }),
				catch: (error) =>
					new InvokeCommandError({
						message: 'Error getting active tabs',
						origError: error,
					}),
			});
			const firstActiveTab = activeTabs[0];
			if (!firstActiveTab) {
				return yield* new InvokeCommandError({ message: 'No active tab found' });
			}
			return firstActiveTab.id;
		}),
} as const satisfies Commands['getCurrentTabId'];

const settingsSchema = z.object({
	isPlaySoundEnabled: z.boolean(),
	isCopyToClipboardEnabled: z.boolean(),
	isPasteContentsOnSuccessEnabled: z.boolean(),
	selectedAudioInputDeviceId: z.string(),
	currentLocalShortcut: z.string(),
	currentGlobalShortcut: z.string(),
	apiKey: z.string(),
	outputLanguage: z.string(),
});
type Settings = z.infer<typeof settingsSchema>;

const getSettings = {
	runsIn: 'WhisperingContentScript',
	runInWhisperingContentScript: () =>
		getLocalStorage({
			key: 'whispering-settings',
			schema: settingsSchema,
			defaultValue: {
				isPlaySoundEnabled: true,
				isCopyToClipboardEnabled: true,
				isPasteContentsOnSuccessEnabled: true,
				selectedAudioInputDeviceId: '',
				currentLocalShortcut: 'space',
				currentGlobalShortcut: '',
				apiKey: '',
				outputLanguage: 'en',
			},
		}),
	invokeFromGlobalContentScript: () =>
		Effect.gen(function* () {
			const whisperingTabId = yield* getOrCreateWhisperingTabId;
			const response = yield* sendMessageToContentScript<Settings>(whisperingTabId, {
				commandName: 'getSettings',
			});
			return response;
		}),
} as const satisfies Commands['getSettings'];

const setSettings = {
	runsIn: 'WhisperingContentScript',
	runInWhisperingContentScript: (settings: Settings) =>
		setLocalStorage({
			key: 'whispering-settings',
			value: JSON.stringify(settings),
		}),
	invokeFromGlobalContentScript: (settings: Settings) =>
		Effect.gen(function* () {
			const whisperingTabId = yield* getOrCreateWhisperingTabId;
			return yield* sendMessageToContentScript<void>(whisperingTabId, {
				commandName: 'setSettings',
				settings,
			});
		}),
} as const satisfies Commands['setSettings'];
const toggleRecording = {
	runsIn: 'GlobalContentScript',
	runInGlobalContentScript: () =>
		Effect.gen(function* () {
			const checkAndUpdateSelectedAudioInputDevice = () =>
				Effect.gen(function* () {
					const settings = yield* getSettings.invokeFromGlobalContentScript();
					const recordingDevices = yield* recorderService.enumerateRecordingDevices;
					const isSelectedDeviceExists = recordingDevices.some(
						({ deviceId }) => deviceId === settings.selectedAudioInputDeviceId,
					);
					if (!isSelectedDeviceExists) {
						// toast.info('Default audio input device not found, selecting first available device');
						const firstAudioInput = recordingDevices[0].deviceId;
						const oldSettings = yield* getSettings.invokeFromGlobalContentScript();
						yield* setSettings.invokeFromGlobalContentScript({
							...oldSettings,
							selectedAudioInputDeviceId: firstAudioInput,
						});
					}
				}).pipe(
					Effect.catchAll((error) => {
						// toast.error(error.message);
						return Effect.succeed(undefined);
					}),
				);
			const recorderService = yield* RecorderService;
			const recorderStateService = yield* RecorderStateService;
			const settings = { apiKey: '', selectedAudioInputDeviceId: '', isPlaySoundEnabled: true };
			if (!settings.apiKey) {
				alert('Please set your API key in the extension options');
				yield* openOptionsPage.invokeFromGlobalContentScript();
				return;
			}
			yield* checkAndUpdateSelectedAudioInputDevice();
			const recorderState = yield* recorderStateService.get();
			switch (recorderState) {
				case 'IDLE': {
					yield* recorderService.startRecording(settings.selectedAudioInputDeviceId);
					if (settings.isPlaySoundEnabled) startSound.play();
					// sendMessageToBackground({ command: 'syncIconToRecorderState', recorderState });
					yield* Effect.logInfo('Recording started');
					yield* recorderStateService.set('RECORDING');
					break;
				}
				case 'RECORDING': {
					yield* recorderService.stopRecording();
					if (settings.isPlaySoundEnabled) stopSound.play();
					// sendMessageToBackground({ command: 'syncIconToRecorderState', recorderState });
					yield* Effect.logInfo('Recording stopped');
					yield* recorderStateService.set('IDLE');
					break;
				}
				default: {
					yield* Effect.logError('Invalid recorder state');
				}
			}
		}).pipe(Effect.provide(RecorderServiceLive), Effect.provide(RecorderStateLive)),
	invokeFromBackgroundServiceWorker: () =>
		Effect.gen(function* () {
			const activeTabId = yield* getActiveTabId();
			yield* sendMessageToContentScript(activeTabId, {
				commandName: 'toggleRecording',
			});
		}),
	invokeFromPopup: () =>
		Effect.gen(function* () {
			const activeTabId = yield* getActiveTabId();
			yield* sendMessageToContentScript(activeTabId, {
				commandName: 'toggleRecording',
			});
		}),
} as const satisfies Commands['toggleRecording'];

const cancelRecording = {
	runsIn: 'GlobalContentScript',
	runInGlobalContentScript: () =>
		Effect.gen(function* () {
			const recorderService = yield* RecorderService;
			const recorderStateService = yield* RecorderStateService;
			const settings = yield* getSettings.invokeFromGlobalContentScript();
			const recorderState = yield* recorderStateService.get();
			yield* recorderService.cancelRecording;
			if (recorderState === 'RECORDING' && settings.isPlaySoundEnabled) cancelSound.play();
			yield* Effect.logInfo('Recording cancelled');
			yield* recorderStateService.set('IDLE');
		}).pipe(Effect.provide(RecorderServiceLive), Effect.provide(RecorderStateLive)),
	invokeFromBackgroundServiceWorker: () =>
		Effect.gen(function* () {
			const activeTabId = yield* getActiveTabId();
			yield* sendMessageToContentScript(activeTabId, {
				commandName: 'cancelRecording',
			});
		}),
	invokeFromPopup: () =>
		Effect.gen(function* () {
			const activeTabId = yield* getActiveTabId();
			yield* sendMessageToContentScript(activeTabId, {
				commandName: 'cancelRecording',
			});
		}),
} as const satisfies Commands['cancelRecording'];

const sendErrorToast = {
	runsIn: 'GlobalContentScript',
	runInGlobalContentScript: (toast) =>
		Effect.gen(function* () {
			const extensionStorage = yield* ExtensionStorageService;
			yield* extensionStorage.set({
				key: 'whispering-toast',
				value: toast,
			});

			// toast.error(message);
		}).pipe(Effect.provide(ExtensionStorageLive)),
} as const satisfies Commands['sendErrorToast'];

/**
 * Object containing implementations of various commands.
 *
 * Commands can be accessed via `commands.[commandName].invokeFrom[context]`
 * where `commandName` is the command name, e.g. `getCurrentTabId`,
 * and `context` is one of the designated contexts like `Popup`, `BackgroundServiceWorker`, etc.
 *
 * Example:
 * ```
 * commands.getCurrentTabId.invokeFromBackgroundServiceWorker();
 * ```
 */
export const commands = {
	getCurrentTabId,
	getSettings,
	setSettings,
	openOptionsPage,
	toggleRecording,
	cancelRecording,
	sendErrorToast,
} as const satisfies Commands;

const getLocalStorage = <TSchema extends z.ZodTypeAny>({
	key,
	schema,
	defaultValue,
}: {
	key: string;
	schema: TSchema;
	defaultValue: z.infer<TSchema>;
}) =>
	Effect.try({
		try: () => {
			const valueFromStorage = localStorage.getItem(key);
			const isEmpty = valueFromStorage === null;
			if (isEmpty) return defaultValue;
			return schema.parse(JSON.parse(valueFromStorage)) as z.infer<TSchema>;
		},
		catch: (error) =>
			new InvokeCommandError({
				message: `Error getting from local storage for key: ${key}`,
				origError: error,
			}),
	}).pipe(Effect.catchAll(() => Effect.succeed(defaultValue)));

const setLocalStorage = ({ key, value }: { key: string; value: any }) =>
	Effect.try({
		try: () => localStorage.setItem(key, value),
		catch: (error) =>
			new InvokeCommandError({
				message: `Error setting in local storage for key: ${key}`,
				origError: error,
			}),
	});

const getOrCreateWhisperingTabId = Effect.gen(function* (_) {
	const tabs = yield* Effect.promise(() => chrome.tabs.query({ url: 'http://localhost:5173/*' }));
	if (tabs.length > 0) {
		for (const tab of tabs) {
			if (tab.pinned) {
				return tab.id;
			}
		}
		return tabs[0].id;
	} else {
		const newTab = yield* Effect.promise(() =>
			chrome.tabs.create({
				url: 'http://localhost:5173',
				active: false,
				pinned: true,
			}),
		);
		return newTab.id;
	}
}).pipe(
	Effect.flatMap(Option.fromNullable),
	Effect.mapError(
		() => new InvokeCommandError({ message: 'Error getting or creating Whispering tab' }),
	),
);

const getActiveTabId = () =>
	Effect.gen(function* () {
		const activeTabs = yield* Effect.tryPromise({
			try: () => chrome.tabs.query({ active: true, currentWindow: true }),
			catch: (error) =>
				new InvokeCommandError({
					message: 'Error getting active tabs',
					origError: error,
				}),
		});
		const firstActiveTab = activeTabs[0];
		if (!firstActiveTab.id) {
			return yield* new InvokeCommandError({ message: 'No active tab ID found' });
		}
		return firstActiveTab.id;
	});

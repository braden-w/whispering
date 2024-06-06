// import { type MessageToContentScriptRequest } from '$lib/utils/messaging';
import { Console, Data, Effect } from 'effect';
import type { PlasmoCSConfig } from 'plasmo';
import { z } from 'zod';
import { type Message } from '~lib/commands';

// import { CHATGPT_DOMAINS } from './chatGptButton';

export const config: PlasmoCSConfig = {
	matches: ['http://localhost:5173/*'],
	// exclude_matches: CHATGPT_DOMAINS,
};

class WhisperingContentScriptError extends Data.TaggedError('WhisperingContentScriptError')<{
	message: string;
	origError?: unknown;
}> {}

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
			new WhisperingContentScriptError({
				message: `Error getting from local storage for key: ${key}`,
				origError: error,
			}),
	}).pipe(Effect.catchAll(() => Effect.succeed(defaultValue)));

const setLocalStorage = ({ key, value }: { key: string; value: any }) =>
	Effect.try({
		try: () => localStorage.setItem(key, value),
		catch: (error) =>
			new WhisperingContentScriptError({
				message: `Error setting in local storage for key: ${key}`,
				origError: error,
			}),
	});

export const whisperingCommands = {
	getSettings: () =>
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
	setSettings: (settings: Settings) =>
		setLocalStorage({
			key: 'whispering-settings',
			value: JSON.stringify(settings),
		}),
} as const;

export type WhisperingMessage = Message<typeof whisperingCommands>;

const _registerListeners = chrome.runtime.onMessage.addListener(
	(message: WhisperingMessage, sender, sendResponse) => {
		const program = Effect.gen(function* () {
			const { commandName, args } = message;
			yield* Console.info('Received message in Whispering content script', { commandName, args });
			const correspondingCommand = whisperingCommands[commandName];
			const response = yield* correspondingCommand(...args);
			yield* Console.info(
				`Responding to invoked command ${commandName} in Whispering content script`,
				{
					response,
				},
			);
			sendResponse(response);
		});
		program.pipe(Effect.runPromise);
		return true; // Will respond asynchronously.
	},
);

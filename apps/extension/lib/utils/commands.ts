const commands = ['getCurrentTabId', 'openOptionsPage', 'setIcon', 'toggleRecording'] as const;
type Command = (typeof commands)[number];

type CommandToImplementations = Record<
	Command,
	Partial<{
		fromBackground: Function;
		fromPopup: Function;
		fromContent: Function;
	}>
>;

/**
 * Object containing implementations of various commands.
 *
 * Commands can be accessed via `invokeCommand.[command].[fromContext]`
 * where `command` is the command name, e.g. `getCurrentTabId`,
 * and `fromContext` is one of 'fromBackground', 'fromPopup', 'fromContent'
 * and refers to the context in which the command is being invoked.
 *
 * Example:
 * ```
 * invokeCommand.getCurrentTabId.fromBackground();
 * ```
 */
export const invokeCommand = {
	getCurrentTabId: {
		// Runs on background
		fromBackground: () => {},
		fromPopup: () => {},
	},
	openOptionsPage: {
		// Runs on background
		fromBackground: () => {},
		fromPopup: () => {},
	},
	setIcon: {
		// Runs on background
		fromBackground: () => {},
		fromPopup: () => {},
	},
	toggleRecording: {
		// Runs on content
		fromContent: () => {},
		fromPopup: () => {},
		fromBackground: () => {},
	},
} as const satisfies CommandToImplementations;

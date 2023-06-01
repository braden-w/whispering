/**
 * Registers a shortcut for the app.
 * @param currentShortcut The shortcut to be registered.
 * @param command The command to be executed when the shortcut is triggered.
 */

export async function registerShortcut(currentShortcut: string, command: () => Promise<void>) {
	if (!window.__TAURI__) return;
	const { register, unregisterAll } = await import('@tauri-apps/api/globalShortcut');
	await unregisterAll();
	await registerWithTimeout({ currentShortcut, command, registerFn: register, timeout: 1000 });
}

/**
 * Unregisters all shortcuts for the app.
 */
export async function unregisterAllShortcuts() {
	if (!window.__TAURI__) return;
	const { unregisterAll } = await import('@tauri-apps/api/globalShortcut');
	await unregisterAll();
}

/**
 * Wraps registerFn, which registers a command to be executed when a specific
 * keyboard shortcut is pressed, and adds a timeout. If the timeout is reached
 * before the command is registered, a timeout error will be thrown.
 */
async function registerWithTimeout({
	currentShortcut,
	command,
	registerFn,
	timeout
}: {
	currentShortcut: string;
	command: () => Promise<void>;
	registerFn: (shortcut: string, command: () => Promise<void>) => Promise<void>;
	timeout: number;
}) {
	const timeoutPromise = new Promise<void>((_, reject) => {
		setTimeout(() => {
			reject(new Error(`Timeout: operation took more than ${timeout} milliseconds`));
		}, timeout);
	});
	await Promise.race([registerFn(currentShortcut, command), timeoutPromise]);
}

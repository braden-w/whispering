/**
 * Registers a shortcut for the app.
 * @param currentShortcut The shortcut to be registered.
 * @param command The command to be executed when the shortcut is triggered.
 */
export async function registerShortcut(currentShortcut: string, command: () => Promise<void>) {
	if (!window.__TAURI__) return;
	if (!isValidAccelerator(currentShortcut)) throw new Error('Invalid shortcut');
	const { register, unregisterAll } = await import('@tauri-apps/api/globalShortcut');
	await unregisterAll();
	await register(currentShortcut, command);
}

/**
 * Unregisters all shortcuts for the app.
 */
export async function unregisterAllShortcuts() {
	if (!window.__TAURI__) return;
	const { unregisterAll } = await import('@tauri-apps/api/globalShortcut');
	await unregisterAll();
}

// From https://github.com/brrd/electron-is-accelerator/blob/master/index.js
const modifiers =
	/^(Command|Cmd|Control|Ctrl|CommandOrControl|CmdOrCtrl|Alt|Option|AltGr|Shift|Super|Meta)$/;
const keyCodes =
	/^([0-9A-Z)!@#$%^&*(:+<_>?~{|}";=,\-./`[\\\]']|F1*[1-9]|F10|F2[0-4]|Plus|Space|Tab|Backspace|Delete|Insert|Return|Enter|Up|Down|Left|Right|Home|End|PageUp|PageDown|Escape|Esc|VolumeUp|VolumeDown|VolumeMute|MediaNextTrack|MediaPreviousTrack|MediaStop|MediaPlayPause|PrintScreen)$/;

function isValidAccelerator(accelerator: string) {
	const parts = accelerator.split('+');
	let keyFound = false;
	return parts.every((val, index) => {
		const isKey = keyCodes.test(val);
		const isModifier = modifiers.test(val);
		if (isKey) {
			// Key must be unique
			if (keyFound) return false;
			keyFound = true;
		}
		// Key is required
		if (index === parts.length - 1 && !keyFound) return false;
		return isKey || isModifier;
	});
}

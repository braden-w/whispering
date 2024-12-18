/**
 * Shared state keys used for communication between extension components:
 * - Content Scripts (injected into web pages)
 * - Popup (extension popup UI)
 * - Background Service Worker
 *
 * These keys are used with the Storage API to maintain synchronized state
 * across all extension contexts. Changes to these values will trigger
 * updates in all listening components.
 *
 * @example
 * ```ts
 * // In popup
 * const [recorderState] = useStorage<RecorderState>(SHARED_STATE_KEYS.RECORDER_STATE);
 *
 * // In background service worker
 * await storage.setItem(SHARED_STATE_KEYS.RECORDER_STATE, 'RECORDING');
 * ```
 */

export const SHARED_EXTENSION_STATE_KEYS = {
	RECORDER_STATE: 'whispering-recorder-state',
	LATEST_RECORDING_TRANSCRIBED_TEXT:
		'whispering-latest-recording-transcribed-text',
	SETTINGS: 'whispering-settings',
} as const;

export const storage = new Storage();

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
 * const [recorderState] = useWhisperingStorage<RecorderState>(SHARED_STATE_KEYS.RECORDER_STATE);
 *
 * // In background service worker
 * await storage.setItem(SHARED_STATE_KEYS.RECORDER_STATE, 'SESSION+RECORDING');
 * ```
 */

import type { WhisperingRecordingState, Settings } from '@repo/shared';

export type WhisperingStorageKeyMap = {
	'whispering-recorder-state': WhisperingRecordingState;
	'whispering-latest-recording-transcribed-text': string;
	'whispering-settings': Settings;
};

export type WhisperingStorageKey = keyof WhisperingStorageKeyMap;

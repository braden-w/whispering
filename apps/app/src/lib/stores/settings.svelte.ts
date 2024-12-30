import { createJobQueue } from '$lib/utils/createJobQueue';
import { createPersistedState } from '$lib/utils/createPersistedState.svelte';
import { toast } from '$lib/utils/toast';
import { tryAsync, trySync } from '@epicenterhq/result';
import {
	WhisperingErr,
	getDefaultSettings,
	settingsSchema,
} from '@repo/shared';
import hotkeys from 'hotkeys-js';
import { recorder } from './recorder.svelte';

export const settings = createPersistedState({
	key: 'whispering-settings',
	schema: settingsSchema,
	defaultValue: getDefaultSettings('app'),
	onUpdateSuccess: () => {
		toast.success({ title: 'Settings updated!', description: '' });
	},
	onUpdateError: (err) => {
		toast.error({
			title: 'Error updating settings',
			description: err instanceof Error ? err.message : 'Unknown error',
		});
	},
});

type RegisterShortcutJob = Promise<void>;

function unregisterAllLocalShortcuts() {
	return trySync({
		try: () => hotkeys.unbind(),
		mapErr: (error) =>
			WhisperingErr({
				title: 'Error unregistering all shortcuts',
				description: 'Please try again.',
				action: { type: 'more-details', error },
			}),
	});
}

function unregisterAllGlobalShortcuts() {
	return tryAsync({
		try: async () => {
			if (!window.__TAURI_INTERNALS__) return;
			const { unregisterAll } = await import(
				'@tauri-apps/plugin-global-shortcut'
			);
			return await unregisterAll();
		},
		mapErr: (error) =>
			WhisperingErr({
				title: 'Error unregistering all shortcuts',
				description: 'Please try again.',
				action: { type: 'more-details', error },
			}),
	});
}

function registerLocalShortcut({
	shortcut,
	callback,
}: {
	shortcut: string;
	callback: () => void;
}) {
	const unregisterAllLocalShortcutsResult = unregisterAllLocalShortcuts();
	if (!unregisterAllLocalShortcutsResult.ok)
		return unregisterAllLocalShortcutsResult;
	return trySync({
		try: () =>
			hotkeys(shortcut, (event) => {
				// Prevent the default refresh event under WINDOWS system
				event.preventDefault();
				callback();
			}),
		mapErr: (error) =>
			WhisperingErr({
				title: 'Error registering local shortcut',
				description: 'Please make sure it is a valid keyboard shortcut.',
				action: { type: 'more-details', error },
			}),
	});
}

async function registerGlobalShortcut({
	shortcut,
	callback,
}: {
	shortcut: string;
	callback: () => void;
}) {
	const unregisterAllGlobalShortcutsResult =
		await unregisterAllGlobalShortcuts();
	if (!unregisterAllGlobalShortcutsResult.ok)
		return unregisterAllGlobalShortcutsResult;
	return tryAsync({
		try: async () => {
			if (!window.__TAURI_INTERNALS__) return;
			const { register } = await import('@tauri-apps/plugin-global-shortcut');
			return await register(shortcut, (event) => {
				if (event.state === 'Pressed') {
					callback();
				}
			});
		},
		mapErr: (error) =>
			WhisperingErr({
				title: 'Error registering global shortcut.',
				description:
					'Please make sure it is a valid Electron keyboard shortcut.',
				action: { type: 'more-details', error },
			}),
	});
}

export const registerShortcuts = createRegisterShortcuts();

function createRegisterShortcuts() {
	const jobQueue = createJobQueue<RegisterShortcutJob>();

	const initialSilentJob = async () => {
		unregisterAllLocalShortcuts();
		await unregisterAllGlobalShortcuts();
		registerLocalShortcut({
			shortcut: settings.value['shortcuts.currentLocalShortcut'],
			callback: recorder.toggleRecordingWithToast,
		});
		await registerGlobalShortcut({
			shortcut: settings.value['shortcuts.currentGlobalShortcut'],
			callback: recorder.toggleRecordingWithToast,
		});
	};

	jobQueue.addJobToQueue(initialSilentJob());

	return {
		registerLocalShortcut: ({
			shortcut,
			callback,
		}: {
			shortcut: string;
			callback: () => void;
		}) => {
			const job = async () => {
				unregisterAllLocalShortcuts();
				registerLocalShortcut({ shortcut, callback });
				toast.success({
					title: `Local shortcut set to ${shortcut}`,
					description: 'Press the shortcut to start recording',
				});
			};
			jobQueue.addJobToQueue(job());
		},
		registerGlobalShortcut: ({
			shortcut,
			callback,
		}: {
			shortcut: string;
			callback: () => void;
		}) => {
			const job = async () => {
				if (!window.__TAURI_INTERNALS__) return;
				unregisterAllGlobalShortcuts();
				await registerGlobalShortcut({ shortcut, callback });
				toast.success({
					title: `Global shortcut set to ${shortcut}`,
					description: 'Press the shortcut to start recording',
				});
			};
			jobQueue.addJobToQueue(job());
		},
	};
}

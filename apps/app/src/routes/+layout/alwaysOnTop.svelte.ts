import { getRecorderFromContext } from '$lib/stores/recorder.svelte';
import { settings } from '$lib/stores/settings.svelte';
import { getTranscriberFromContext } from '$lib/stores/transcriber.svelte';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function syncWindowAlwaysOnTopWithRecorderState() {
	const recorder = getRecorderFromContext();
	const transcriber = getTranscriberFromContext();

	$effect(() => {
		const setAlwaysOnTop = (value: boolean) =>
			getCurrentWindow().setAlwaysOnTop(value);
		switch (settings.value['system.alwaysOnTop']) {
			case 'Always':
				void setAlwaysOnTop(true);
				break;
			case 'When Recording and Transcribing':
				if (
					recorder.recorderState === 'SESSION+RECORDING' ||
					transcriber.isCurrentlyTranscribing
				) {
					void setAlwaysOnTop(true);
				} else {
					void setAlwaysOnTop(false);
				}
				break;
			case 'When Recording':
				if (recorder.recorderState === 'SESSION+RECORDING') {
					void setAlwaysOnTop(true);
				} else {
					void setAlwaysOnTop(false);
				}
				break;
			case 'Never':
				void setAlwaysOnTop(false);
				break;
		}
	});
}

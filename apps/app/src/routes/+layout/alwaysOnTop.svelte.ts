import { recorder } from '$lib/stores/recorder.svelte';
import { transcriber } from '$lib/stores/recordings.svelte';
import { settings } from '$lib/stores/settings.svelte';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function syncWindowAlwaysOnTopWithRecorderState() {
	$effect(() => {
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

function setAlwaysOnTop(value: boolean) {
	if (!window.__TAURI_INTERNALS__) return;
	return getCurrentWindow().setAlwaysOnTop(value);
}

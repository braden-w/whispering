import type { recorder } from '../app/src/lib/stores/recorder.svelte';
declare global {
	interface Window {
		recorder: typeof recorder;
		goto: (url: string) => Promise<void>;
	}
}

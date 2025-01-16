import '@tanstack/svelte-table';
import type { recorder } from './lib/stores/recorder.svelte';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
	interface Window {
		__TAURI_INTERNALS__: Record<string, unknown>;
		recorder: typeof recorder;
		goto: (url: string) => Promise<void>;
	}
}

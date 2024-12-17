import '@tanstack/svelte-table';

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
		toggleRecording: () => void;
		cancelRecording: () => void;
		goto: (url: string) => Promise<void>;
	}
}

declare module '@tanstack/svelte-table' {
	interface ColumnMeta<TData extends RowData, TValue> {
		headerText: string;
	}
}

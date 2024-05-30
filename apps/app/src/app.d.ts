import '@repo/svelte-table';

// See https://kit.svelte.dev/docs/types#app
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
		__TAURI__: Record<string, unknown>;
	}
}

declare module '@repo/svelte-table' {
	interface ColumnMeta<TData extends RowData, TValue> {
		headerText: string;
	}
}

export {};

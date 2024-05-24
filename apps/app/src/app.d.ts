import 'unplugin-icons/types/svelte';
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
}

declare module '@repo/svelte-table' {
	interface ColumnMeta<TData extends RowData, TValue> {
		headerText: string;
	}
}

export {};

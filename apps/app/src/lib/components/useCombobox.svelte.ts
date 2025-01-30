import { tick } from 'svelte';

export function useCombobox() {
	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement | null>(null);

	return {
		get open() {
			return open;
		},
		set open(value) {
			open = value;
		},
		get triggerRef() {
			return triggerRef;
		},
		set triggerRef(value) {
			triggerRef = value;
		},
		closeAndFocusTrigger() {
			open = false;
			tick().then(() => {
				triggerRef?.focus();
			});
		},
	};
}

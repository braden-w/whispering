export const fasterRerecordExplainedDialog = (() => {
	let isOpen = $state(false);
	return {
		get isOpen() {
			return isOpen;
		},
		set isOpen(v) {
			isOpen = v;
		},
	};
})();

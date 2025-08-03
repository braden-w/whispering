export function createBlobUrlManager() {
	let currentUrl: string | undefined;

	return {
		createUrl: (blob: Blob | undefined): string | undefined => {
			if (!blob) return undefined;

			// Cleanup previous URL if it exists
			if (currentUrl) {
				URL.revokeObjectURL(currentUrl);
			}

			// Create and store new URL
			currentUrl = URL.createObjectURL(blob);
			return currentUrl;
		},

		revokeCurrentUrl: () => {
			if (currentUrl) {
				URL.revokeObjectURL(currentUrl);
				currentUrl = undefined;
			}
		},
	};
}

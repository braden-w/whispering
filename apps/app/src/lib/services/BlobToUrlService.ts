export const blobToUrlService = createBlobToUrlService();

function createBlobToUrlService() {
	const blobToUrl = new Map<Blob, string>();

	return {
		createBlobUrl(blob: Blob) {
			if (blobToUrl.has(blob)) return blobToUrl.get(blob);
			const url = URL.createObjectURL(blob);
			blobToUrl.set(blob, url);
			return url;
		},
		revokeBlobUrl(blob: Blob) {
			const url = blobToUrl.get(blob);
			if (url) {
				URL.revokeObjectURL(url);
				blobToUrl.delete(blob);
			}
		},
	};
}

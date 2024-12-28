import { onDestroy } from 'svelte';

/*
 * Creates a URL that is synced to the blob.
 * The URL is revoked when the blob changes.
 */
export function createUrlSyncedToBlob(blob: Blob) {
	let previousBlobUrl: string | undefined = undefined;

	const blobUrl = $derived.by(() => {
		if (!blob) return undefined;
		const newUrl = URL.createObjectURL(blob);
		if (previousBlobUrl) URL.revokeObjectURL(previousBlobUrl);
		previousBlobUrl = newUrl;
		return newUrl;
	});

	onDestroy(() => {
		if (blobUrl) URL.revokeObjectURL(blobUrl);
	});

	return blobUrl;
}
